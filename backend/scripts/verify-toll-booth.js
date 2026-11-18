const path = require('path');
const envPath = path.join(__dirname, '../../.env');
console.log('DEBUG: Loading .env from', envPath);
require('dotenv').config({ path: envPath });
console.log('DEBUG: Encoded DATABASE_URL:', process.env.DATABASE_URL ? 'FOUND' : 'MISSING');
const db = require('../config/db');
const assignmentService = require('../services/assignmentService');

async function runVerification() {
    try {
        console.log('🧪 Starting Toll Booth Verification...');
        const dbUrl = process.env.DATABASE_URL;
        console.log('DEBUG: DATABASE_URL is ' + (dbUrl ? (dbUrl.substring(0, 15) + '...') : 'UNDEFINED'));

        // 1. Setup Test Data
        const c1Id = `C-${Date.now()}-1`;
        const c2Id = `C-${Date.now()}-2`;
        const c3Id = `C-${Date.now()}-3`;
        const suffix = Date.now();
        const topName = `Top Pro ${suffix}`;
        const midName = `Mid Pro ${suffix}`;

        console.log(' Creating Contractors...');
        await db.pool.query(`INSERT INTO contractors (id, email, name, quality_score, is_verified, stripe_customer_id, password_hash) VALUES ($1, $2, $3, 900, TRUE, 'cus_test', 'hash1'), ($4, $5, $6, 800, TRUE, 'cus_test', 'hash2'), ($7, $8, 'Low Pro', 700, TRUE, 'cus_test', 'hash3')`,
            [c1Id, `top-${suffix}@pro.com`, topName, c2Id, `mid-${suffix}@pro.com`, midName, c3Id, `low-${suffix}@pro.com`]);

        // 1b. Create Customer
        const custEmail = 'cust@test.com';
        const autoEmail = 'auto@test.com';
        await db.pool.query(`INSERT INTO customers (id, email, name, address) VALUES ($1, $2, 'Customer One', '123 Test St') ON CONFLICT (email) DO NOTHING`, [`cust-${Date.now()}`, custEmail]);
        await db.pool.query(`INSERT INTO customers (id, email, name, address) VALUES ($1, $2, 'Auto Customer', '456 Auto Ln') ON CONFLICT (email) DO NOTHING`, [`cust-auto-${Date.now()}`, autoEmail]);

        // 2. Create Request (Standard)
        const reqStandard = { customerEmail: custEmail, customerName: 'Customer', address: '123 Test St', problemDescription: 'Fix sink' };
        const createdReq = await db.createRequest(reqStandard);
        const reqId = createdReq.id;

        console.log(` Created Request ${reqId}`);

        // 3. Test Matching
        console.log(' Testing Match Logic...');
        const match1 = await assignmentService.findMatch(reqId);
        console.log(` First Match Should be Top Pro (Score 900): ${match1 && match1.name === topName ? '✅ PASS' : '❌ FAIL (' + match1?.name + ')'}`);

        // 4. Create Assignment
        await assignmentService.createAssignment(reqId, match1.id, 'standard');
        console.log(' Assigned to Top Pro.');

        // 5. Test Exclusion (Should match Mid Pro next)
        const match2 = await assignmentService.findMatch(reqId);
        console.log(` Next Match Should be Mid Pro (Score 800): ${match2 && match2.name === midName ? '✅ PASS' : '❌ FAIL (' + match2?.name + ')'}`);

        // 6. Test Expiration (Simulate time pass)
        console.log(' Simulating Expiration...');
        // Force expire existing assignment
        await db.pool.query(`UPDATE lead_assignments SET expires_at = NOW() - INTERVAL '1 minute' WHERE request_id = $1`, [reqId]);

        await assignmentService.handleExpiration();

        // Check if new assignment exists for Mid Pro
        const result = await db.pool.query(`SELECT * FROM lead_assignments WHERE request_id = $1 AND contractor_id = $2`, [reqId, c2Id]);
        const newAssignment = result.rows[0];
        console.log(` Automatic Cycle to Mid Pro: ${newAssignment ? '✅ PASS' : '❌ FAIL'}`);



        // 8. Test Auto-Judge
        console.log('⚖️ Testing Auto-Judge...');

        // Setup scenarios: 
        // Create 3 outbound logs separated by 4 hours
        const reqAutoId = `REQ-AUTO-${Date.now()}`;
        // Create request manually to avoid notification errors if email service not fully mocked
        await db.pool.query(`INSERT INTO service_requests (id, customer_email, customer_name, problem_description, urgency) VALUES ($1, 'auto@test.com', 'Auto Customer', 'Auto Judge Test', 'standard')`, [reqAutoId]);

        // Ensure Contractor 1 is "verified" and has 0 balance (or known balance)
        await db.pool.query(`UPDATE contractors SET account_balance = 0 WHERE id = $1`, [c1Id]);

        // Create assignment and accept it
        const asgAuto = await assignmentService.createAssignment(reqAutoId, c1Id, 'standard');
        await db.pool.query(`UPDATE lead_assignments SET status = 'accepted' WHERE id = $1`, [asgAuto.id]);

        // Insert Logs
        const now = new Date();
        const fourHoursAgo = new Date(now.getTime() - 4.1 * 60 * 60 * 1000);
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        await db.pool.query(`INSERT INTO communication_logs (request_id, contractor_id, direction, created_at) VALUES ($1, $2, 'outbound', $3)`, [reqAutoId, c1Id, fourHoursAgo]);
        await db.pool.query(`INSERT INTO communication_logs (request_id, contractor_id, direction, created_at) VALUES ($1, $2, 'outbound', $3)`, [reqAutoId, c1Id, twoHoursAgo]);
        await db.pool.query(`INSERT INTO communication_logs (request_id, contractor_id, direction, created_at) VALUES ($1, $2, 'outbound', $3)`, [reqAutoId, c1Id, now]);

        // Trigger Auto-Judge
        const resultAuto = await assignmentService.autoJudgeDispute(asgAuto.id, c1Id, reqAutoId);
        console.log(` Auto-Judge Result (Should be True): ${resultAuto ? '✅ PASS' : '❌ FAIL'}`);

        // Check Balance (Should be 50)
        const contractorRes = await db.pool.query(`SELECT account_balance FROM contractors WHERE id = $1`, [c1Id]);
        const balance = parseFloat(contractorRes.rows[0].account_balance);
        console.log(` Contractor Balance Credited (Should be 50): ${balance === 50.00 ? '✅ PASS' : '❌ FAIL (' + balance + ')'}`);

        // 7. Cleanup
        // await db.pool.query('DELETE FROM lead_assignments WHERE request_id = $1', [reqId]);
        // await db.pool.query('DELETE FROM service_requests WHERE id = $1', [reqId]);
        // await db.pool.query('DELETE FROM contractors WHERE id IN ($1, $2, $3)', [c1Id, c2Id, c3Id]);

        console.log('✅ Verification Complete.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    }
}

runVerification();
