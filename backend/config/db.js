// Enhanced PostgreSQL database for Railway deployment
// File: backend/database-postgresql.js

const { Pool } = require('pg');

class PostgreSQLDatabase {
  constructor() {
    // Railway provides DATABASE_URL automatically
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    this.initializeTables();
  }

  async initializeTables() {
    try {
      // Create tables if they don't exist
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS service_requests (
          id VARCHAR(255) PRIMARY KEY,
          customer_email VARCHAR(255) REFERENCES customers(email),
          customer_name VARCHAR(255),
          address TEXT,
          problem_description TEXT,
          status VARCHAR(50) DEFAULT 'received',
          quote DECIMAL(10,2),
          payment_status VARCHAR(50),
          payment_id VARCHAR(255),
          appointment_date TIMESTAMP,
          notes TEXT,
          files JSONB,
          timeline JSONB,
          vault_documents JSONB,
          contractor_name VARCHAR(255),
          contractor_coi_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Update the customers table to add password fields
      await this.pool.query(`
        ALTER TABLE customers 
          ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
          ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
          ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP,
          ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
          ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP;
      `);

      // Update service_requests table for Vault
      await this.pool.query(`
        ALTER TABLE service_requests
          ADD COLUMN IF NOT EXISTS vault_documents JSONB,
          ADD COLUMN IF NOT EXISTS contractor_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS contractor_coi_url TEXT;
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id VARCHAR(255) PRIMARY KEY,
          request_id VARCHAR(255) REFERENCES service_requests(id),
          amount DECIMAL(10,2) NOT NULL,
          customer_email VARCHAR(255),
          status VARCHAR(50) DEFAULT 'pending',
          stripe_payment_intent_id VARCHAR(255),
          refund_amount DECIMAL(10,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id SERIAL PRIMARY KEY,
          customer_email VARCHAR(255) UNIQUE NOT NULL,
          subscription_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // CONTRACTORS TABLE (Merged Schema)
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS contractors (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          company_name VARCHAR(255),
          insurance_url TEXT,
          insurance_expiry TIMESTAMP,
          certification_fee_paid BOOLEAN DEFAULT FALSE,
          certification_payment_id VARCHAR(255),
          vetting_status JSONB DEFAULT '{"identity": "pending", "background": "pending", "insurance": "pending", "digital_audit": "pending", "intro_video": "pending"}'::jsonb,
          files JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Update service_requests for contractor_id
      await this.pool.query(`
        ALTER TABLE service_requests
          ADD COLUMN IF NOT EXISTS contractor_id VARCHAR(255);
      `);

      // SEED CONTRACTOR (If empty)
      const contractorCount = await this.pool.query('SELECT COUNT(*) FROM contractors');
      if (parseInt(contractorCount.rows[0].count) === 0) {
        console.log('🌱 Seeding Contractors...');
        await this.pool.query(`
            INSERT INTO contractors (id, name, email, company_name, insurance_url, password_hash)
            VALUES 
            ('cont_001', 'Mike The Plumber', 'mike@eliteplumbing.com', 'Elite Plumbing Co.', 'https://res.cloudinary.com/demo/image/upload/v1611311094/sample_coi_pdf_demo.pdf', 'hash123'),
            ('cont_002', 'Sarah Sparks', 'sarah@electricdoctors.com', 'Electric Doctors', 'https://res.cloudinary.com/demo/image/upload/v1611311094/sample_coi_pdf_demo.pdf', 'hash123');
          `);
      }

      try {
        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS lead_assignments (
            id VARCHAR(255) PRIMARY KEY,
            request_id VARCHAR(255) REFERENCES service_requests(id),
            contractor_id VARCHAR(255) REFERENCES contractors(id),
            status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired, rejected, disputed, under_review
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            dispute_reason TEXT,
            evidence_payload JSONB,
            denial_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
      } catch (err) {
        // Ignore unique_violation for type name which can happen on IF NOT EXISTS race/conflicts
        if (err.code !== '23505') {
          console.error('Error creating lead_assignments:', err);
        }
      }

      // Add certification and urgency to service_requests
      await this.pool.query(`
        ALTER TABLE service_requests 
          ADD COLUMN IF NOT EXISTS is_certified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS urgency VARCHAR(50) DEFAULT 'standard';
      `);

      // Update contractors table for insurance fields
      await this.pool.query(`
        ALTER TABLE contractors 
          ADD COLUMN IF NOT EXISTS insurance_url TEXT,
          ADD COLUMN IF NOT EXISTS insurance_expiry TIMESTAMP,
          ADD COLUMN IF NOT EXISTS quality_score INT DEFAULT 0,
          ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS account_balance DECIMAL(10,2) DEFAULT 0.00,
          ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
      `);

      // Communication Logs for Auto-Judge
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS communication_logs (
          id SERIAL PRIMARY KEY,
          request_id VARCHAR(255),
          contractor_id VARCHAR(255),
          customer_phone VARCHAR(50),
          direction VARCHAR(20), -- 'outbound', 'inbound'
          type VARCHAR(20), -- 'call', 'sms', 'in_app'
          duration INT, -- seconds, 0 for sms
          status VARCHAR(50), -- 'completed', 'no-answer', 'failed'
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('✅ Database tables initialized');
    } catch (error) {
      console.error('❌ Database initialization error:', error);
    }
  }

  // --- Contractor Methods ---

  async getAllContractors() {
    try {
      const result = await this.pool.query('SELECT * FROM contractors ORDER BY name ASC');
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting all contractors:', error);
      return [];
    }
  }

  async getContractor(id) {
    try {
      const result = await this.pool.query('SELECT * FROM contractors WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error getting contractor:', error);
      return null;
    }
  }

  async createContractor(data) {
    // Helper to manually add contractors if needed
    try {
      const result = await this.pool.query(`
        INSERT INTO contractors (id, name, email, company_name, insurance_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
       `, [data.id, data.name, data.email, data.companyName, data.insuranceUrl]);
      return result.rows[0];
    } catch (err) { console.error(err); return null; }
  }


  async removePushSubscription(email) {
    try {
      await this.pool.query(
        'DELETE FROM push_subscriptions WHERE customer_email = $1',
        [email.toLowerCase()]
      );
      console.log(`📱 Push subscription removed for: ${email}`);
    } catch (error) {
      console.error('Error removing push subscription:', error);
    }
  }

  async createCustomerWithPassword(customerData) {
    try {
      const crypto = require('crypto');
      const bcrypt = require('bcryptjs');

      const normalizedEmail = customerData.email.toLowerCase();
      const existing = await this.findCustomerByEmail(normalizedEmail);

      if (existing) {
        throw new Error('Customer already exists with this email');
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const customerId = `cust_${Date.now()}`;
      const result = await this.pool.query(`
        INSERT INTO customers (
          id, email, name, address, 
          email_verified, verification_token, verification_expires
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        customerId,
        normalizedEmail,
        customerData.name,
        customerData.address,
        false,
        verificationToken,
        verificationExpires
      ]);

      return {
        ...result.rows[0],
        verificationToken // Include token for email
      };
    } catch (error) {
      console.error('Error creating customer with password:', error);
      throw error;
    }
  }

  async verifyCustomerEmail(token) {
    try {
      const result = await this.pool.query(`
        UPDATE customers 
        SET email_verified = true, 
            verification_token = NULL, 
            verification_expires = NULL
        WHERE verification_token = $1 
          AND verification_expires > NOW()
        RETURNING *
      `, [token]);

      return result.rows[0];
    } catch (error) {
      console.error('Error verifying email:', error);
      return null;
    }
  }

  async setCustomerPassword(email, passwordHash) {
    try {
      const result = await this.pool.query(`
        UPDATE customers 
        SET password_hash = $1
        WHERE email = $2
        RETURNING *
      `, [passwordHash, email.toLowerCase()]);

      return result.rows[0];
    } catch (error) {
      console.error('Error setting password:', error);
      throw error;
    }
  }

  async createPasswordResetToken(email) {
    try {
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const result = await this.pool.query(`
        UPDATE customers 
        SET reset_token = $1, reset_expires = $2
        WHERE email = $3
        RETURNING *
      `, [resetToken, resetExpires, email.toLowerCase()]);

      if (result.rows[0]) {
        return resetToken;
      }
      return null;
    } catch (error) {
      console.error('Error creating reset token:', error);
      return null;
    }
  }

  async resetPassword(token, newPasswordHash) {
    try {
      const result = await this.pool.query(`
        UPDATE customers 
        SET password_hash = $1, 
            reset_token = NULL, 
            reset_expires = NULL
        WHERE reset_token = $2 
          AND reset_expires > NOW()
        RETURNING *
      `, [newPasswordHash, token]);

      return result.rows[0];
    } catch (error) {
      console.error('Error resetting password:', error);
      return null;
    }
  }

  async validateCustomerPassword(email, password) {
    try {
      const bcrypt = require('bcryptjs');
      const customer = await this.findCustomerByEmail(email);

      if (!customer || !customer.password_hash) {
        return null;
      }

      const isValid = await bcrypt.compare(password, customer.password_hash);
      if (!isValid) {
        return null;
      }

      // Don't return password hash
      const { password_hash, ...customerData } = customer;
      return customerData;
    } catch (error) {
      console.error('Error validating password:', error);
      return null;
    }
  }

  // Customer methods
  async findCustomerByEmail(email) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM customers WHERE email = $1',
        [email.toLowerCase()]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error finding customer:', error);
      return null;
    }
  }

  async createOrUpdateCustomer(customerData) {
    try {
      const normalizedEmail = customerData.email.toLowerCase();
      const existing = await this.findCustomerByEmail(normalizedEmail);

      if (existing) {
        // Update existing customer
        const result = await this.pool.query(`
          UPDATE customers 
          SET name = $1, address = $2, updated_at = CURRENT_TIMESTAMP
          WHERE email = $3
          RETURNING *
        `, [customerData.name, customerData.address, normalizedEmail]);
        return result.rows[0];
      } else {
        // Create new customer
        const customerId = `cust_${Date.now()}`;
        const result = await this.pool.query(`
          INSERT INTO customers (id, email, name, address)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [customerId, normalizedEmail, customerData.name, customerData.address]);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error creating/updating customer:', error);
      throw error;
    }
  }

  // Contractor methods
  async createContractor(contractorData) {
    try {
      const contractorId = `cont_${Date.now()}`;
      const result = await this.pool.query(`
        INSERT INTO contractors (
          id, email, password_hash, name, business_name
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        contractorId,
        contractorData.email.toLowerCase(),
        contractorData.passwordHash,
        contractorData.name,
        contractorData.businessName
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating contractor:', error);
      throw error;
    }
  }

  async findContractorByEmail(email) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM contractors WHERE email = $1',
        [email.toLowerCase()]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error finding contractor:', error);
      return null;
    }
  }

  async findContractorById(id) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM contractors WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error finding contractor by ID:', error);
      return null;
    }
  }

  async updateContractorPayment(id, paymentId) {
    try {
      const result = await this.pool.query(`
        UPDATE contractors 
        SET certification_fee_paid = TRUE,
            certification_payment_id = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [paymentId, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating contractor payment:', error);
      throw error;
    }
  }

  async updateContractorVetting(id, statusUpdates) {
    try {
      // First get current status to merge
      const current = await this.findContractorById(id);
      if (!current) return null;

      const newStatus = { ...current.vetting_status, ...statusUpdates };

      const result = await this.pool.query(`
        UPDATE contractors 
        SET vetting_status = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [JSON.stringify(newStatus), id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating contractor vetting:', error);
      throw error;
    }
  }

  async updateContractorFiles(id, fileUpdates) {
    try {
      const current = await this.findContractorById(id);
      if (!current) return null;

      const newFiles = { ...current.files, ...fileUpdates };

      const result = await this.pool.query(`
        UPDATE contractors 
        SET files = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [JSON.stringify(newFiles), id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating contractor files:', error);
      throw error;
    }
  }

  // Request methods
  async createRequest(requestData) {
    try {
      const requestId = `REQ-${Date.now().toString().slice(-6)}`;
      const timeline = [
        {
          status: 'received',
          timestamp: new Date(),
          message: 'Request received and being reviewed'
        }
      ];

      const result = await this.pool.query(`
        INSERT INTO service_requests (
          id, customer_email, customer_name, address, problem_description,
          status, files, timeline
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        requestId,
        requestData.customerEmail.toLowerCase(),
        requestData.customerName,
        requestData.address,
        requestData.problemDescription,
        'received',
        JSON.stringify(requestData.files || []),
        JSON.stringify(timeline)
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  }

  async getRequest(requestId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM service_requests WHERE id = $1',
        [requestId]
      );
      const request = result.rows[0];
      if (request) {
        // Parse JSON fields
        request.files = request.files || [];
        request.timeline = request.timeline || [];
      }
      return request;
    } catch (error) {
      console.error('Error getting request:', error);
      return null;
    }
  }

  async getRequestsByCustomerEmail(email) {
    try {
      const result = await this.pool.query(`
        SELECT * FROM service_requests 
        WHERE customer_email = $1 
        ORDER BY created_at DESC
      `, [email.toLowerCase()]);

      return result.rows.map(request => {
        request.files = request.files || [];
        request.timeline = request.timeline || [];
        return request;
      });
    } catch (error) {
      console.error('Error getting customer requests:', error);
      return [];
    }
  }

  async updateRequestStatus(requestId, status, message, additionalData = {}) {
    try {
      // Get current request
      const current = await this.getRequest(requestId);
      if (!current) return null;

      // Update timeline
      const timeline = current.timeline || [];
      timeline.push({
        status,
        timestamp: new Date(),
        message: message || this.getDefaultStatusMessage(status)
      });

      // Prepare update query
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      updateFields.push(`status = $${paramIndex++}`);
      values.push(status);

      updateFields.push(`timeline = $${paramIndex++}`);
      values.push(JSON.stringify(timeline));

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      // Handle additional data
      if (additionalData.quote !== undefined) {
        updateFields.push(`quote = $${paramIndex++}`);
        values.push(additionalData.quote);
      }
      if (additionalData.appointmentDate) {
        updateFields.push(`appointment_date = $${paramIndex++}`);
        values.push(additionalData.appointmentDate);
      }
      if (additionalData.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(additionalData.notes);
      }
      if (additionalData.paymentStatus) {
        updateFields.push(`payment_status = $${paramIndex++}`);
        values.push(additionalData.paymentStatus);
      }

      if (additionalData.paymentId) {
        updateFields.push(`payment_id = $${paramIndex++}`);
        values.push(additionalData.paymentId);
      }

      // Update Vault fields
      if (additionalData.vault_documents) {
        updateFields.push(`vault_documents = $${paramIndex++}`);
        values.push(additionalData.vault_documents);
      }
      if (additionalData.contractor_name) {
        updateFields.push(`contractor_name = $${paramIndex++}`);
        values.push(additionalData.contractor_name);
      }
      if (additionalData.contractor_coi_url) {
        updateFields.push(`contractor_coi_url = $${paramIndex++}`);
        values.push(additionalData.contractor_coi_url);
      }
      if (additionalData.contractor_id) {
        updateFields.push(`contractor_id = $${paramIndex++}`);
        values.push(additionalData.contractor_id);
      }

      values.push(requestId);

      const result = await this.pool.query(`
        UPDATE service_requests 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      const updatedRequest = result.rows[0];
      if (updatedRequest) {
        updatedRequest.files = updatedRequest.files || [];
        updatedRequest.timeline = updatedRequest.timeline || [];

        // Add notification data
        updatedRequest.shouldNotify = current.status !== status;
        updatedRequest.notificationData = {
          title: this.getNotificationTitle(status, updatedRequest.quote),
          body: this.getNotificationBody(status, updatedRequest),
          icon: '/icon-192x192.png',
          data: {
            requestId: updatedRequest.id,
            status: status,
            quote: updatedRequest.quote,
            url: `/customer-portal/request/${updatedRequest.id}`
          }
        };
      }

      return updatedRequest;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }

  async getAllRequests() {
    try {
      const result = await this.pool.query(`
        SELECT * FROM service_requests 
        ORDER BY created_at DESC
      `);

      return result.rows.map(request => {
        request.files = request.files || [];
        request.timeline = request.timeline || [];
        return request;
      });
    } catch (error) {
      console.error('Error getting all requests:', error);
      return [];
    }
  }

  // Payment methods
  async createPaymentRequest(requestId, amount, customerEmail) {
    try {
      const paymentId = `PAY-${Date.now()}`;

      const result = await this.pool.query(`
        INSERT INTO payments (id, request_id, amount, customer_email, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [paymentId, requestId, amount, customerEmail.toLowerCase(), 'pending']);

      // Update the service request with payment info
      await this.pool.query(`
        UPDATE service_requests 
        SET payment_id = $1, payment_status = $2
        WHERE id = $3
      `, [paymentId, 'pending', requestId]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating payment request:', error);
      throw error;
    }
  }

  async getPaymentRequest(paymentId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM payments WHERE id = $1',
        [paymentId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error getting payment request:', error);
      return null;
    }
  }

  async updatePaymentStatus(paymentId, status, additionalData = {}) {
    try {
      const updateFields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
      const values = [status];
      let paramIndex = 2;

      // Handle additional data
      if (additionalData.stripePaymentIntentId) {
        updateFields.push(`stripe_payment_intent_id = $${paramIndex++}`);
        values.push(additionalData.stripePaymentIntentId);
      }
      if (additionalData.refundAmount) {
        updateFields.push(`refund_amount = $${paramIndex++}`);
        values.push(additionalData.refundAmount);
      }

      values.push(paymentId);

      const result = await this.pool.query(`
        UPDATE payments 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      const payment = result.rows[0];
      if (payment) {
        // Update the associated service request
        await this.pool.query(`
          UPDATE service_requests 
          SET payment_status = $1
          WHERE id = $2
        `, [status, payment.request_id]);
      }

      return payment;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  async getAllPaymentRequests() {
    try {
      const result = await this.pool.query(`
        SELECT * FROM payments 
        ORDER BY created_at DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error getting all payment requests:', error);
      return [];
    }
  }

  // Push subscription methods
  async savePushSubscription(email, subscription) {
    try {
      await this.pool.query(`
        INSERT INTO push_subscriptions (customer_email, subscription_data)
        VALUES ($1, $2)
        ON CONFLICT (customer_email) 
        DO UPDATE SET subscription_data = $2
      `, [email.toLowerCase(), JSON.stringify(subscription)]);

      console.log(`💬 Push subscription saved for: ${email}`);
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  }

  async getPushSubscription(email) {
    try {
      const result = await this.pool.query(
        'SELECT subscription_data FROM push_subscriptions WHERE customer_email = $1',
        [email.toLowerCase()]
      );
      return result.rows[0]?.subscription_data;
    } catch (error) {
      console.error('Error getting push subscription:', error);
      return null;
    }
  }

  async getAllSubscriptions() {
    try {
      const result = await this.pool.query(
        'SELECT subscription_data FROM push_subscriptions'
      );
      return result.rows.map(row => row.subscription_data);
    } catch (error) {
      console.error('Error getting all subscriptions:', error);
      return [];
    }
  }

  // Stats methods
  async getRequestStats() {
    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'received') as pending,
          COUNT(*) FILTER (WHERE status = 'quoted') as quoted,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'quoted' AND payment_status IS NULL) as awaiting_payment,
          COUNT(*) FILTER (WHERE payment_status = 'completed') as paid
        FROM service_requests
      `);

      return result.rows[0];
    } catch (error) {
      console.error('Error getting request stats:', error);
      return {};
    }
  }

  async getPaymentStats() {
    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COUNT(*) FILTER (WHERE status = 'refunded') as refunded,
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue
        FROM payments
      `);

      return result.rows[0];
    } catch (error) {
      console.error('Error getting payment stats:', error);
      return {};
    }
  }

  // Helper methods
  getDefaultStatusMessage(status) {
    const messages = {
      'received': 'Request received and being reviewed',
      'quoted': 'Quote provided - awaiting approval',
      'approved': 'Quote approved - payment received',
      'scheduled': 'Appointment scheduled',
      'in_progress': 'Work in progress',
      'completed': 'Service completed',
      'cancelled': 'Service cancelled'
    };
    return messages[status] || 'Status updated';
  }

  getNotificationTitle(status, quote) {
    const titles = {
      'received': '✅ Request Received',
      'quoted': quote ? `💰 Quote Ready: $${quote}` : '💰 Quote Ready',
      'approved': '✅ Payment Received - Approved',
      'scheduled': '📅 Appointment Scheduled',
      'in_progress': '🔧 Work Started',
      'completed': '🎉 Service Complete',
      'cancelled': '❌ Service Cancelled'
    };
    return titles[status] || 'Request Updated';
  }

  getNotificationBody(status, request) {
    const bodies = {
      'received': `Your HNDY request ${request.id} has been received and is being reviewed.`,
      'quoted': `Your quote for ${request.id} is ready! ${request.quote ? `$${request.quote}` : 'View details in the app.'}`,
      'approved': `Payment received! Your service request ${request.id} has been approved.`,
      'scheduled': `Your appointment for ${request.id} has been scheduled.`,
      'in_progress': `Your handyman has started work on request ${request.id}.`,
      'completed': `Great news! Your service request ${request.id} has been completed.`,
      'cancelled': `Your service request ${request.id} has been cancelled.`
    };
    return bodies[status] || `Your request ${request.id} has been updated.`;
  }

  // Cleanup method
  async close() {
    await this.pool.end();
  }

  saveNotificationHistory(email, notificationData, success) {
    console.log(`📱 Notification ${success ? 'sent' : 'failed'} to ${email}: ${notificationData.title}`);
  }
}

module.exports = new PostgreSQLDatabase();