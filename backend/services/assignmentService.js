const db = require('../config/db');

class AssignmentService {
    /**
     * Finds the best matching contractor for a request who hasn't been assigned yet.
     * @param {string} requestId 
     * @returns {Promise<Object|null>} Contractor or null
     */
    async findMatch(requestId) {
        try {
            // Get the request to check details if needed (e.g. location in future)
            const request = await db.getRequest(requestId);
            if (!request) return null;

            // Find highest scoring verified contractor who hasn't been assigned to this request yet
            const result = await db.pool.query(`
        SELECT c.* 
        FROM contractors c
        WHERE c.is_verified = TRUE
        AND c.id NOT IN (
          SELECT contractor_id 
          FROM lead_assignments 
          WHERE request_id = $1
        )
        ORDER BY c.quality_score DESC
        LIMIT 1
      `, [requestId]);

            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding match:', error);
            return null;
        }
    }

    /**
     * Creates a new exclusive assignment for a contractor
     * @param {string} requestId 
     * @param {string} contractorId 
     * @param {string} urgency 'standard' | 'urgent'
     */
    async createAssignment(requestId, contractorId, urgency = 'standard') {
        try {
            const assignmentId = `ASG-${Date.now()}`;

            // Calculate expiry
            const now = new Date();
            const expiryMinutes = urgency === 'urgent' ? 5 : 60;
            const expiresAt = new Date(now.getTime() + expiryMinutes * 60000);

            const result = await db.pool.query(`
        INSERT INTO lead_assignments (
          id, request_id, contractor_id, status, assigned_at, expires_at
        )
        VALUES ($1, $2, $3, 'pending', $4, $5)
        RETURNING *
      `, [assignmentId, requestId, contractorId, now, expiresAt]);

            console.log(`✅ Assignment ${assignmentId} created for Contractor ${contractorId} (Expires: ${expiresAt.toISOString()})`);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating assignment:', error);
            throw error;
        }
    }

    /**
     * Checks for expired assignments and cycles to the next contractor
     * Should be called by Cron
     */
    async handleExpiration() {
        try {
            // Find all pending assignments that have expired
            const result = await db.pool.query(`
        SELECT * FROM lead_assignments
        WHERE status = 'pending' 
        AND expires_at < NOW()
      `);

            const expiredAssignments = result.rows;
            if (expiredAssignments.length === 0) return;

            console.log(`Checking expiration: Found ${expiredAssignments.length} expired assignments.`);

            for (const assignment of expiredAssignments) {
                // 1. Mark as expired
                await db.pool.query(`
          UPDATE lead_assignments 
          SET status = 'expired', updated_at = NOW()
          WHERE id = $1
        `, [assignment.id]);

                // 2. Find next match
                const nextContractor = await this.findMatch(assignment.request_id);

                if (nextContractor) {
                    // Get urgency from request to set correct time
                    const reqResult = await db.pool.query('SELECT urgency FROM service_requests WHERE id = $1', [assignment.request_id]);
                    const urgency = reqResult.rows[0]?.urgency || 'standard';

                    await this.createAssignment(assignment.request_id, nextContractor.id, urgency);
                    console.log(`🔄 Cycled request ${assignment.request_id} to next contractor ${nextContractor.name}`);
                } else {
                    console.log(`⚠️ No more matching contractors for request ${assignment.request_id}`);
                }
            }
        } catch (error) {
            console.error('Error handling assignment expiration:', error);
        }
    }
    /**
     * Fails an assignment (e.g. payment failure) and immediately matching the next contractor.
     * @param {string} assignmentId 
     * @param {string} reason 
     */
    async failAssignment(assignmentId, reason) {
        try {
            console.log(`❌ Failing assignment ${assignmentId}: ${reason}`);

            // 1. Mark as rejected/failed
            // We use 'rejected' or 'payment_failed' logic. Let's use 'rejected' with a reason note if possible.
            // Schema has 'dispute_reason' but not 'rejection_reason', we can abuse 'dispute_reason' or just log it.
            // Or just use filter logic in findMatch to ensure we don't pick the same one.
            // findMatch checks "NOT IN lead_assignments". So creating a row for this contractor with status 'rejected' is sufficient.

            const result = await db.pool.query(`
                UPDATE lead_assignments 
                SET status = 'rejected', 
                    dispute_reason = $1, -- Storing failure reason here for simplicity
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *
            `, [reason, assignmentId]);

            const assignment = result.rows[0];
            if (!assignment) return;

            // 2. Find next match immediately
            const nextContractor = await this.findMatch(assignment.request_id);

            if (nextContractor) {
                const reqResult = await db.pool.query('SELECT urgency FROM service_requests WHERE id = $1', [assignment.request_id]);
                const urgency = reqResult.rows[0]?.urgency || 'standard';

                await this.createAssignment(assignment.request_id, nextContractor.id, urgency);
                console.log(`🔄 Immediately cycled request ${assignment.request_id} to next contractor ${nextContractor.name}`);
            } else {
                console.log(`⚠️ No more matching contractors for request ${assignment.request_id}`);
            }

        } catch (error) {
            console.error('Error failing assignment:', error);
            throw error;
        }
    }

    /**
     * Auto-Judge Dispute Logic for 'Unresponsive Customer'
     * @param {string} assignmentId 
     * @param {string} contractorId 
     * @param {string} requestId 
     */
    async autoJudgeDispute(assignmentId, contractorId, requestId) {
        try {
            console.log(`⚖️ Running Auto-Judge for Assignment ${assignmentId}`);

            // 1. Query Communication Logs
            // Criteria: >= 3 outbound attempts, > 0 duration (if call? actually usually 0 if no answer, but typically calls log attempts) 
            // The prompt says "zero return communication". So we check outbound vs inbound.

            const logsResult = await db.pool.query(`
                SELECT * FROM communication_logs 
                WHERE request_id = $1 AND contractor_id = $2
                ORDER BY created_at ASC
            `, [requestId, contractorId]);

            const logs = logsResult.rows;

            // Filter for outbound attempts to verified number (assuming customer_phone is verifying implicitly by being in logs)
            const outboundAttempts = logs.filter(l => l.direction === 'outbound');
            const inboundResponse = logs.filter(l => l.direction === 'inbound');

            if (inboundResponse.length > 0) {
                console.log('⚖️ Auto-Judge: Client responded. Not auto-approving.');
                return false; // Client responded, so not "Unresponsive"
            }

            if (outboundAttempts.length >= 3) {
                // Check timespan (>= 4 hours)
                const firstAttempt = new Date(outboundAttempts[0].created_at);
                const lastAttempt = new Date(outboundAttempts[outboundAttempts.length - 1].created_at);
                const diffHours = (lastAttempt - firstAttempt) / (1000 * 60 * 60);

                if (diffHours >= 4) {
                    console.log(`⚖️ Auto-Judge: CRITERIA MET (3+ attempts over ${diffHours.toFixed(1)}h). Approving Credit.`);

                    // AUTO APPROVE

                    // 1. Credit Balance
                    await db.pool.query(`
                        UPDATE contractors 
                        SET account_balance = account_balance + 50.00
                        WHERE id = $1
                    `, [contractorId]);

                    // 2. Update Status
                    await db.pool.query(`
                        UPDATE lead_assignments 
                        SET status = 'disputed', -- Resolved
                            denial_reason = 'Auto-Approved: Verified Unresponsive Customer'
                        WHERE id = $1
                    `, [assignmentId]);

                    // 3. Send Notification (Mock)
                    // In real app: notificationService.send(contractorId, ...)
                    console.log(`🔔 NOTIFICATION SENT: "HNDY Auto-Judge verified your attempts. A $50 lead credit has been added to your account."`);

                    return true;
                }
            }

            console.log('⚖️ Auto-Judge: Criteria NOT met. Escalating to Under Review.');
            return false;

        } catch (error) {
            console.error('Error in Auto-Judge:', error);
            return false;
        }
    }
}

module.exports = new AssignmentService();
