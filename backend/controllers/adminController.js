const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendCustomerEmail } = require('../utils/emailService');
const emailTemplates = require('../utils/emailTemplates');
const { sendPushNotification } = require('../services/notificationService');
const { generateWarrantyPDF } = require('../utils/pdfGenerator');
const { cloudinary } = require('../config/storage');
const stream = require('stream');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

exports.login = (req, res) => {
    try {
        const { email, password } = req.body;

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const adminToken = jwt.sign(
                { email, role: 'admin' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token: adminToken,
                admin: { email }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const requests = await db.getAllRequests();
        const stats = await db.getRequestStats(); // Ensure await
        res.json({ success: true, requests, stats });
    } catch (error) {
        console.error('❌ Error fetching admin requests:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requests' });
    }
};

exports.getAllContractors = async (req, res) => {
    try {
        const contractors = await db.getAllContractors();
        res.json({ success: true, contractors });
    } catch (error) {
        console.error('❌ Error fetching contractors:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch contractors' });
    }
};

exports.getAdminServices = async (req, res) => {
    try {
        const requests = await db.getAllRequests();

        const services = requests.map(request => ({
            id: request.id,
            customerName: request.customer_name,
            customerEmail: request.customer_email,
            serviceType: request.problem_description ? 'General Repair' : 'Service Request',
            description: request.problem_description || 'Service request',
            status: request.status,
            quote: request.quote,
            paymentStatus: request.payment_status,
            paymentId: request.payment_id,
            scheduledDate: request.appointment_date,
            createdAt: request.created_at,
            location: request.address,
            photos: request.files ? request.files.map(f => `/uploads/${f.filename}`) : [],
            notes: request.notes || ''
        }));

        res.json(services);
    } catch (error) {
        console.error('❌ Error fetching admin services:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch services' });
    }
};

exports.updateService = async (req, res) => {
    try {
        const { status, quote, scheduledDate, notes, contractorName, contractorCoiUrl } = req.body;

        console.log('🔍 Admin panel update received:', {
            id: req.params.id,
            status,
            files: req.files ? Object.keys(req.files) : 'No files',
            body: req.body
        });

        const additionalData = {};
        if (quote !== undefined && quote !== '') {
            additionalData.quote = parseFloat(quote);
            additionalData.quoteAmount = parseFloat(quote);
        }
        if (scheduledDate) additionalData.appointmentDate = scheduledDate;
        if (notes !== undefined) additionalData.notes = notes;

        // Handle Contractor Info
        if (contractorName) additionalData.contractor_name = contractorName;
        if (contractorCoiUrl) additionalData.contractor_coi_url = contractorCoiUrl;

        // --- VAULT LOGIC ---
        // If status is becoming 'completed' or we are updating a completed job with new docs
        if (status === 'completed') {
            const vaultDocuments = [];
            const timestamp = new Date().toISOString();

            // 1. Handle Uploaded Invoice
            if (req.files && req.files['invoice']) {
                const invoiceFile = req.files['invoice'][0];
                vaultDocuments.push({
                    type: 'invoice',
                    name: 'Final Invoice',
                    url: invoiceFile.path,
                    filename: `HNDY_Invoice_${req.params.id}.pdf`, // simplified
                    date: timestamp
                });
            }

            // 2. Handle Uploaded COI (or use URL if provided textually)
            let coiUrl = contractorCoiUrl;
            if (req.files && req.files['coi']) {
                const coiFile = req.files['coi'][0];
                coiUrl = coiFile.path;
                additionalData.contractor_coi_url = coiUrl; // Save to root col too
            }

            if (coiUrl) {
                vaultDocuments.push({
                    type: 'insurance',
                    name: 'Contractor Insurance (COI)',
                    url: coiUrl,
                    filename: `HNDY_COI_${contractorName || 'Pro'}.pdf`,
                    date: timestamp
                });
            }

            // 3. Generate Warranty PDF
            try {
                // Fetch full request data for the PDF
                const fullRequest = await db.getRequest(req.params.id);
                const customer = await db.findCustomerByEmail(fullRequest.customer_email || fullRequest.customerEmail);

                if (fullRequest && customer) {
                    const pdfBuffer = await generateWarrantyPDF(fullRequest, customer, contractorName || fullRequest.contractor_name);

                    // Upload generated PDF to Cloudinary
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'hndy-vault',
                            resource_type: 'raw', // Use raw for PDFs usually, or auto
                            public_id: `warranty_${req.params.id}_${Date.now()}`,
                            format: 'pdf'
                        },
                        (error, result) => {
                            if (error) console.error('❌ Warranty upload failed:', error);
                            // Note: This is async inside the stream. 
                            // For simplicity in this plan, we might need a sync wrapper or just hope it finishes, 
                            // BUT standard practice is to await the upload.
                        }
                    );

                    // PROPER AWAIT PATTERN for Cloudinary Stream
                    const warrantyUrl = await new Promise((resolve, reject) => {
                        const upload = cloudinary.uploader.upload_stream(
                            { folder: 'hndy-vault', resource_type: 'auto', format: 'pdf' },
                            (error, result) => {
                                if (error) return reject(error);
                                resolve(result.secure_url);
                            }
                        );
                        const bufferStream = new stream.PassThrough();
                        bufferStream.end(pdfBuffer);
                        bufferStream.pipe(upload);
                    });

                    vaultDocuments.push({
                        type: 'warranty',
                        name: 'HNDY 1-Year Workmanship Guarantee',
                        url: warrantyUrl,
                        filename: `HNDY_Warranty_${req.params.id}.pdf`,
                        date: timestamp
                    });
                }
            } catch (err) {
                console.error('❌ Error generating/uploading warranty:', err);
                // Continue without warranty if fail, or throw?
                // For now, log and continue.
            }

            if (vaultDocuments.length > 0) {
                // We need to merge with existing if any? For now, we overwrite or we would need to fetch first.
                // Simpler: Just pass it to updateRequestStatus which should handle it.
                // db.js updateRequestStatus needs to handle 'vault_documents' update.
                additionalData.vault_documents = JSON.stringify(vaultDocuments);
            }
        }

        const updatedRequest = await db.updateRequestStatus(
            req.params.id,
            status,
            notes || 'Status updated via admin panel',
            additionalData
        );

        if (!updatedRequest) {
            return res.status(404).json({ success: false, message: 'Service request not found' });
        }

        console.log(`✅ Service ${updatedRequest.id} updated via admin panel:`, {
            status: updatedRequest.status,
            quote: updatedRequest.quote,
            quoteAmount: updatedRequest.quoteAmount,
            scheduledDate: additionalData.appointmentDate
        });

        // Send appropriate email based on status
        try {
            const recipientEmail = updatedRequest.customer_email || updatedRequest.customerEmail;
            const recipientName = updatedRequest.customer_name || updatedRequest.customerName;

            if (status === 'quoted' && additionalData.quote) {
                const quoteEmail = emailTemplates.quoteReady(updatedRequest);
                await sendCustomerEmail(recipientEmail, quoteEmail.subject, quoteEmail.html);

                // Send quote notification
                const quoteNotification = {
                    title: `💰 Quote Ready: ${additionalData.quote}`,
                    body: `Hi ${recipientName}, your service quote of ${additionalData.quote} is ready for review!`,
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                    data: {
                        requestId: updatedRequest.id,
                        status: 'quoted',
                        quote: additionalData.quote,
                        url: '/customer-portal'
                    }
                };
                await sendPushNotification(recipientEmail, quoteNotification);

            } else if (status === 'scheduled' && additionalData.appointmentDate) {
                const scheduledEmail = emailTemplates.serviceScheduled(updatedRequest, additionalData.appointmentDate);
                await sendCustomerEmail(recipientEmail, scheduledEmail.subject, scheduledEmail.html);

                // Send scheduled notification
                const scheduledNotification = {
                    title: '📅 Service Scheduled',
                    body: `${recipientName}, your service has been scheduled. Check your portal for details.`,
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                    data: {
                        requestId: updatedRequest.id,
                        status: 'scheduled',
                        appointmentDate: additionalData.appointmentDate,
                        url: '/customer-portal'
                    }
                };
                await sendPushNotification(recipientEmail, scheduledNotification);

            } else if (status === 'completed') {
                const completedEmail = emailTemplates.serviceCompleted(updatedRequest);
                await sendCustomerEmail(recipientEmail, completedEmail.subject, completedEmail.html);

                // Send completed notification
                const completedNotification = {
                    title: '✅ Service Completed',
                    body: `${recipientName}, your service is complete! Please rate your experience.`,
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                    data: {
                        requestId: updatedRequest.id,
                        status: 'completed',
                        url: '/customer-portal'
                    }
                };
                await sendPushNotification(recipientEmail, completedNotification);

            } else if (status === 'in_progress') {
                // Send in progress notification
                const inProgressNotification = {
                    title: '🔧 Technician On The Way',
                    body: `${recipientName}, our technician is on the way to your location!`,
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                    data: {
                        requestId: updatedRequest.id,
                        status: 'in_progress',
                        url: '/customer-portal'
                    }
                };
                await sendPushNotification(recipientEmail, inProgressNotification);
            }
        } catch (emailError) {
            console.error('❌ Error sending notification:', emailError);
            // Don't fail the request if email/notification fails
        }

        res.json({
            success: true,
            message: 'Service updated successfully',
            service: updatedRequest
        });

    } catch (error) {
        console.error('❌ Error updating service via admin panel:', error);
        res.status(500).json({ success: false, message: 'Failed to update service' });
    }
};

exports.testQuoteEmail = async (req, res) => {
    try {
        const { requestId, sendTo } = req.body;

        const request = await db.getRequest(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        if (!request.quote) {
            return res.status(400).json({ success: false, message: 'Request has no quote set' });
        }

        const quoteEmail = emailTemplates.quoteReady(request);
        const emailTo = sendTo || request.customer_email || request.customerEmail;
        const sent = await sendCustomerEmail(emailTo, quoteEmail.subject, quoteEmail.html);

        res.json({
            success: sent,
            message: sent ? `Quote email sent to ${emailTo}` : 'Failed to send quote email',
            requestId: request.id,
            quote: request.quote,
            recipient: emailTo
        });
    } catch (error) {
        console.error('❌ Test quote email failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test quote email',
            error: error.message
        });
    }
};

exports.resendConfirmation = async (req, res) => {
    try {
        const request = await db.getRequest(req.params.requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        const customerEmail = request.customer_email || request.customerEmail;
        const customerName = request.customer_name || request.customerName;

        if (!customerEmail) {
            return res.status(400).json({ success: false, message: 'No customer email found' });
        }

        const confirmationEmail = emailTemplates.requestConfirmation(request, customerName);
        const sent = await sendCustomerEmail(customerEmail, confirmationEmail.subject, confirmationEmail.html);

        if (sent) {
            res.json({
                success: true,
                message: `Confirmation email resent to ${customerEmail}`
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send confirmation email'
            });
        }
    } catch (error) {
        console.error('❌ Error resending confirmation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend confirmation'
        });
    }
};

exports.updateRequestStatus = async (req, res) => {
    try {
        const { status, message, quoteAmount, appointmentDate, quote } = req.body;

        const additionalData = {};
        if (quoteAmount) additionalData.quoteAmount = quoteAmount;
        if (quote !== undefined && quote !== '') {
            additionalData.quote = parseFloat(quote);
            additionalData.quoteAmount = parseFloat(quote);
        }
        if (appointmentDate) additionalData.appointmentDate = appointmentDate;

        const updatedRequest = await db.updateRequestStatus(
            req.params.requestId,
            status,
            message,
            additionalData
        );

        if (!updatedRequest) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        console.log(`✅ Request ${updatedRequest.id} status updated to: ${status}`, {
            quote: additionalData.quote,
            quoteAmount: additionalData.quoteAmount
        });

        // Send push notification to customer if status changed
        if (updatedRequest.shouldNotify) {
            const customerEmail = updatedRequest.customerEmail || updatedRequest.customer_email;
            await sendPushNotification(customerEmail, updatedRequest.notificationData);
        }

        res.json({ success: true, request: updatedRequest });
    } catch (error) {
        console.error('❌ Error updating request:', error);
        res.status(500).json({ success: false, message: 'Failed to update request' });
    }
};

exports.getPaymentHistory = async (req, res) => {
    try {
        const payments = await db.getAllPaymentRequests();
        const stats = await db.getPaymentStats();

        // Enrich with request info
        const enrichedPayments = await Promise.all(payments.map(async (payment) => {
            const request = await db.getRequest(payment.requestId);
            return {
                ...payment,
                customerName: request?.customerName || 'Unknown',
                customerEmail: request?.customerEmail || 'Unknown',
                requestStatus: request?.status || 'Unknown',
                problemDescription: request?.problemDescription || 'Service request'
            };
        }));

        res.json({
            payments: enrichedPayments,
            stats: stats
        });
    } catch (error) {
        console.error('❌ Error fetching payment history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
    }
};

exports.processRefund = async (req, res) => {
    try {
        const { requestId, refundAmount, refundId } = req.body;

        const request = await db.getRequest(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        const updatedRequest = await db.updateRequestStatus(
            requestId,
            'refunded',
            'Refund processed',
            {
                payment_status: 'refunded',
                refund_id: refundId,
                refund_amount: refundAmount,
                refund_date: new Date().toISOString()
            }
        );

        const refundEmail = emailTemplates.refundConfirmation(updatedRequest, refundAmount);
        await sendCustomerEmail(updatedRequest.customer_email || updatedRequest.customerEmail, refundEmail.subject, refundEmail.html);

        const refundNotification = {
            title: '💸 Refund Processed',
            body: `Hi ${updatedRequest.customer_name || updatedRequest.customerName}, your refund of ${refundAmount} has been processed.`,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
                requestId: updatedRequest.id,
                status: 'refunded',
                refundAmount: refundAmount,
                url: '/customer-portal'
            }
        };
        await sendPushNotification(updatedRequest.customer_email || updatedRequest.customerEmail, refundNotification);

        res.json({
            success: true,
            message: 'Refund processed successfully',
            request: updatedRequest
        });

    } catch (error) {
        console.error('❌ Error processing refund:', error);
        res.status(500).json({ success: false, message: 'Failed to process refund' });
    }
};
