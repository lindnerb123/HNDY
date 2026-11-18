const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const assignmentService = require('../services/assignmentService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

exports.register = async (req, res) => {
    try {
        const { name, businessName, email, password } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const existing = await db.findContractorByEmail(email);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const contractor = await db.createContractor({
            name,
            businessName,
            email,
            passwordHash
        });

        const token = jwt.sign(
            { id: contractor.id, email: contractor.email, role: 'contractor' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            contractor: {
                id: contractor.id,
                email: contractor.email,
                name: contractor.name,
                vetting_status: contractor.vetting_status,
                certification_fee_paid: contractor.certification_fee_paid
            }
        });
    } catch (error) {
        console.error('Contractor registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const contractor = await db.findContractorByEmail(email);

        if (!contractor) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, contractor.password_hash);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: contractor.id, email: contractor.email, role: 'contractor' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            contractor: {
                id: contractor.id,
                email: contractor.email,
                name: contractor.name,
                vetting_status: contractor.vetting_status,
                certification_fee_paid: contractor.certification_fee_paid
            }
        });

    } catch (error) {
        console.error('Contractor login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};

exports.getStatus = async (req, res) => {
    try {
        const contractor = await db.findContractorById(req.user.id);
        if (!contractor) {
            return res.status(404).json({ success: false, message: 'Contractor not found' });
        }
        res.json({
            success: true,
            status: contractor.vetting_status,
            feePaid: contractor.certification_fee_paid,
            files: contractor.files
        });
    } catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({ success: false, message: 'Failed to get status' });
    }
};

exports.createPaymentIntent = async (req, res) => {
    try {
        const amount = 14900; // $149.00

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            metadata: {
                contractorId: req.user.id,
                type: 'certification_fee'
            }
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({ success: false, message: 'Payment initiation failed' });
    }
};

exports.confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        // In a real app, verify with Stripe API first
        // For now, we trust the client (danger!) or assume connection is valid
        // Ideally use webhooks, but for this "Gatekeeper" flow we can do a direct confirmation for speed

        // Better: Retrieve PI from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            await db.updateContractorPayment(req.user.id, paymentIntentId);
            res.json({ success: true, message: 'Payment confirmed' });
        } else {
            res.status(400).json({ success: false, message: 'Payment not successful' });
        }

    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ success: false, message: 'Payment confirmation failed' });
    }
};

exports.updateVettingStep = async (req, res) => {
    try {
        const { step, status } = req.body;
        const allowedSteps = ['identity', 'background', 'insurance', 'digital_audit', 'intro_video'];

        if (!allowedSteps.includes(step)) {
            return res.status(400).json({ success: false, message: 'Invalid vetting step' });
        }

        const updates = {};
        updates[step] = status;

        const updated = await db.updateContractorVetting(req.user.id, updates);
        res.json({ success: true, status: updated.vetting_status });

    } catch (error) {
        console.error('Update vetting error:', error);
        res.status(500).json({ success: false, message: 'Failed to update vetting status' });
    }
};

// --- Toll Booth Methods ---

exports.getDashboard = async (req, res) => {
    try {
        const contractorId = req.user.id;

        const result = await db.pool.query(`
      SELECT la.*, sr.address, sr.problem_description, sr.urgency
      FROM lead_assignments la
      JOIN service_requests sr ON la.request_id = sr.id
      WHERE la.contractor_id = $1
      ORDER BY la.assigned_at DESC
    `, [contractorId]);

        const leads = result.rows.map(assignment => {
            if (assignment.status === 'pending') {
                return {
                    ...assignment,
                    customer_phone: '***-***-****',
                    customer_email: '*****@****.com'
                };
            }
            return assignment;
        });

        res.json({ success: true, leads });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ success: false, message: 'Dashboard error' });
    }
};

exports.acceptLead = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const contractor = req.user;

        // Retrieve full contractor details to get stripe id
        const cResult = await db.pool.query('SELECT * FROM contractors WHERE id = $1', [contractor.id]);
        const fullContractor = cResult.rows[0];

        const result = await db.pool.query('SELECT * FROM lead_assignments WHERE id = $1', [assignmentId]);
        const assignment = result.rows[0];

        if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
        if (assignment.status !== 'pending') return res.status(400).json({ success: false, message: 'Lead is not pending' });

        if (!fullContractor.stripe_customer_id) {
            return res.status(400).json({ success: false, message: 'No payment method on file' });
        }

        try {
            // Stripe Pre-Authorization (Manual Capture)
            const paymentIntent = await stripe.paymentIntents.create({
                amount: 5000,
                currency: 'usd',
                customer: fullContractor.stripe_customer_id,
                capture_method: 'manual',
                description: `Lead Fee for Request ${assignment.request_id}`,
                confirm: true,
                automatic_payment_methods: { enabled: true, allow_redirects: 'never' }
            });

            if (paymentIntent.status !== 'requires_capture' && paymentIntent.status !== 'succeeded') {
                throw new Error(`Payment status: ${paymentIntent.status}`);
            }

            // Success: Update Assignment
            const updated = await db.pool.query(`
            UPDATE lead_assignments 
            SET status = 'accepted', updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `, [assignmentId]);

            // Reveal Customer Info
            const reqResult = await db.pool.query('SELECT * FROM service_requests WHERE id = $1', [assignment.request_id]);
            const request = reqResult.rows[0];

            res.json({
                success: true,
                message: 'Lead Accepted! Payment Pre-Authorized.',
                contactInfo: {
                    name: request.customer_name,
                    phone: request.customer_phone,
                    email: request.customer_email,
                    address: request.address
                }
            });

        } catch (stripeError) {
            console.error('Stripe Pre-Auth Error:', stripeError);

            // FAIL IMMEDIATELY & CYCLE
            await assignmentService.failAssignment(assignmentId, `Payment Failed: ${stripeError.message}`);

            return res.status(402).json({
                success: false,
                message: 'Payment Hold Failed. Lead has been passed to next contractor.',
                error: stripeError.message
            });
        }

    } catch (error) {
        console.error('Error accepting lead:', error);
        res.status(500).json({ success: false, message: 'Acceptance failed' });
    }
};

exports.disputeLead = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { disputeReason, evidencePayload } = req.body;

        if (!disputeReason || !evidencePayload) {
            return res.status(400).json({ success: false, message: 'Reason and Evidence are required' });
        }

        const result = await db.pool.query('SELECT * FROM lead_assignments WHERE id = $1', [assignmentId]);
        const assignment = result.rows[0];

        if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
        if (assignment.status !== 'accepted') return res.status(400).json({ success: false, message: 'Can only dispute accepted leads' });

        await db.pool.query(`
            UPDATE lead_assignments 
            SET status = 'under_review', 
                dispute_reason = $1, 
                evidence_payload = $2,
                updated_at = NOW()
            WHERE id = $3
        `, [disputeReason, JSON.stringify(evidencePayload), assignmentId]);

        // HNDY Auto-Judge Trigger
        if (disputeReason === 'Unresponsive Customer') {
            const autoApproved = await assignmentService.autoJudgeDispute(assignmentId, assignment.contractor_id, assignment.request_id);
            if (autoApproved) {
                return res.json({ success: true, message: 'Dispute Auto-Approved! $50 Credit Issued.' });
            }
        }

        res.json({ success: true, message: 'Dispute submitted for review' });

    } catch (error) {
        console.error('Error disputing lead:', error);
        res.status(500).json({ success: false, message: 'Dispute failed' });
    }
};

exports.adminResolveDispute = async (req, res) => {
    try {
        const { assignmentId, approved, denialReason } = req.body;

        const result = await db.pool.query('SELECT * FROM lead_assignments WHERE id = $1', [assignmentId]);
        const assignment = result.rows[0];

        if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

        if (approved) {
            await db.pool.query(`
                UPDATE contractors 
                SET account_balance = account_balance + 50.00
                WHERE id = $1
            `, [assignment.contractor_id]);

            await db.pool.query(`
                UPDATE lead_assignments SET status = 'disputed' WHERE id = $1
            `, [assignmentId]);

            res.json({ success: true, message: 'Dispute Approved. $50 Credit issued.' });
        } else {
            if (!denialReason) return res.status(400).json({ success: false, message: 'Denial reason required by law' });

            await db.pool.query(`
                UPDATE lead_assignments 
                SET status = 'accepted', 
                    denial_reason = $1 
                WHERE id = $2
            `, [denialReason, assignmentId]);

            res.json({ success: true, message: 'Dispute Denied' });
        }

    } catch (error) {
        console.error('Error resolving dispute:', error);
        res.status(500).json({ success: false, message: 'Resolution failed' });
    }
}
