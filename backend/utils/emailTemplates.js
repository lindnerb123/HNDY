// Email templates for different events
const emailTemplates = {

    // Account Verification Email
    accountVerification: (customer, verificationLink) => ({
        subject: `🔐 Verify Your HNDY Account`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; background: #f9f9f9; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .button-container { text-align: center; margin: 30px 0; }
          .verify-button { 
            display: inline-block; 
            background: #667eea; 
            color: white; 
            padding: 16px 32px; 
            border-radius: 8px; 
            text-decoration: none; 
            font-weight: bold; 
            font-size: 16px; 
          }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Welcome to HNDY!</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${customer.name},</h2>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #667eea;">Your Account Has Been Created!</h3>
              <p>Thank you for submitting a service request. We've created an account for you to track your requests and manage your services.</p>
              <p style="margin-bottom: 0;"><strong>Email:</strong> ${customer.email}</p>
            </div>
  
            <div class="info-box">
              <h3 style="margin-top: 0;">Set Your Password</h3>
              <p>Click the button below to verify your email and set your password:</p>
            </div>
  
            <div class="button-container">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${verificationLink}" style="height:52px;v-text-anchor:middle;width:200px;" arcsize="15%" stroke="f" fillcolor="#667eea">
                <w:anchorlock/>
                <center>
              <![endif]-->
              <a href="${verificationLink}" class="verify-button" target="_blank">Set My Password</a>
              <!--[if mso]>
                </center>
              </v:roundrect>
              <![endif]-->
            </div>
  
            <div style="text-align: center; margin: 20px 0;">
              <p style="color: #666; font-size: 14px; margin: 10px 0;">
                <em>Button not working? Copy and paste this link into your browser:</em>
              </p>
              <p style="margin: 10px 0;">
                <a href="${verificationLink}" 
                   style="color: #667eea; text-decoration: underline; word-break: break-all; font-size: 14px;" 
                   target="_blank">
                  ${verificationLink}
                </a>
              </p>
            </div>
  
            <div class="info-box" style="background: #fef3c7; border: 1px solid #fbbf24;">
              <p style="margin: 0;">
                <strong>⚠️ Important:</strong> This link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© HNDY - Your Trusted Handyman Service</p>
            <p style="margin: 0; font-size: 12px;">This email was sent to ${customer.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
    }),

    // Updated passwordReset email template with bulletproof button
    passwordReset: (customer, resetLink) => ({
        subject: `🔑 Reset Your HNDY Password`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #f59e0b, #f97316); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; background: #f9f9f9; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
          
          /* Bulletproof button styles */
          .button-container { text-align: center; margin: 30px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔑 Password Reset Request</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${customer.name},</h2>
            
            <div class="info-box">
              <p>We received a request to reset your HNDY account password. If you didn't make this request, you can safely ignore this email.</p>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Reset Your Password</h3>
              <p>Click the button below to create a new password:</p>
            </div>

            <!-- Bulletproof Button Table Structure -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center">
                  <table border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" bgcolor="#f59e0b" style="border-radius: 8px;">
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetLink}" style="height:50px;v-text-anchor:middle;width:200px;" arcsize="15%" strokecolor="#f59e0b" fillcolor="#f59e0b">
                          <w:anchorlock/>
                          <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Reset Password</center>
                        </v:roundrect>
                        <![endif]-->
                        <!--[if !mso]><!-- -->
                        <a href="${resetLink}" style="background-color:#f59e0b;border:1px solid #f59e0b;border-radius:8px;color:#ffffff;display:inline-block;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;line-height:50px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;mso-hide:all;" target="_blank">Reset Password</a>
                        <!--<![endif]-->
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <div style="text-align: center; margin: 20px 0;">
              <p style="color: #666; font-size: 14px; margin: 10px 0;">
                <em>Button not working? Copy and paste this link into your browser:</em>
              </p>
              <p style="margin: 10px 0; word-wrap: break-word; word-break: break-all;">
                <a href="${resetLink}" 
                   style="color: #f59e0b; text-decoration: underline; font-size: 14px;" 
                   target="_blank">
                  ${resetLink}
                </a>
              </p>
            </div>

            <div class="info-box" style="background: #fee2e2; border: 1px solid #ef4444;">
              <p style="margin: 0;">
                <strong>⏰ Important:</strong> This link will expire in 1 hour for security reasons. If you need a new link, please request another password reset.
              </p>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Security Tips</h3>
              <ul style="margin-bottom: 0;">
                <li>Choose a strong password with letters, numbers, and symbols</li>
                <li>Don't use the same password on multiple sites</li>
                <li>Never share your password with anyone</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© HNDY - Your Trusted Handyman Service</p>
            <p style="margin: 0; font-size: 12px;">This email was sent to ${customer.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
    }),

    // Welcome Email (after password is set)
    welcomeEmail: (customer) => ({
        subject: `🎉 Welcome to HNDY - Account Activated!`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; background: #f9f9f9; }
          .success-box { background: #d1fae5; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #10b981; text-align: center; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .button-container { text-align: center; margin: 30px 0; }
          .portal-button { 
            display: inline-block; 
            background: #10b981; 
            color: white; 
            padding: 16px 32px; 
            border-radius: 8px; 
            text-decoration: none; 
            font-weight: bold; 
            font-size: 16px; 
          }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Account Activated!</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome aboard, ${customer.name}!</h2>
            
            <div class="success-box">
              <h3 style="margin: 0 0 10px 0; color: #059669;">Your account is now active!</h3>
              <p style="margin: 0;">You can now log in to track your service requests and manage your account.</p>
            </div>
  
            <div class="info-box">
              <h3 style="margin-top: 0;">Your Login Details</h3>
              <p><strong>Email:</strong> ${customer.email}</p>
              <p style="margin-bottom: 0;"><strong>Password:</strong> The password you just created</p>
            </div>
  
            <div class="button-container">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal" style="height:52px;v-text-anchor:middle;width:200px;" arcsize="15%" stroke="f" fillcolor="#10b981">
                <w:anchorlock/>
                <center>
              <![endif]-->
              <a href="${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal" class="portal-button" target="_blank">Go to Customer Portal</a>
              <!--[if mso]>
                </center>
              </v:roundrect>
              <![endif]-->
            </div>
  
            <div class="info-box">
              <h3 style="margin-top: 0;">What You Can Do in Your Portal</h3>
              <ul style="margin-bottom: 0;">
                <li>View all your service requests</li>
                <li>Track request status in real-time</li>
                <li>View and pay quotes online</li>
                <li>Access service history</li>
                <li>Manage your account settings</li>
              </ul>
            </div>
  
            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              Need help? Just reply to this email and we'll assist you right away!
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© HNDY - Your Trusted Handyman Service</p>
            <p style="margin: 0; font-size: 12px;">Welcome to the HNDY family!</p>
          </div>
        </div>
      </body>
      </html>
    `
    }),

    // Request Confirmation Email - Updated with New Customer Support
    requestConfirmation: (request, customerName, isNewCustomer = false) => ({
        subject: `✅ HNDY Request ${request.id} Received - We'll Quote Soon!`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #a3e635, #16a34a); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; background: #f9f9f9; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .status-badge { display: inline-block; background: #16a34a; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
          .timeline { border-left: 3px solid #a3e635; padding-left: 20px; margin: 20px 0; }
          .timeline-item { margin-bottom: 20px; position: relative; }
          .timeline-item:before { content: ''; position: absolute; left: -27px; top: 0; width: 12px; height: 12px; background: #a3e635; border-radius: 50%; }
          .account-box { background: #e0f2fe; border: 1px solid #0284c7; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .account-box h3 { margin-top: 0; color: #0284c7; }
          .button-container { text-align: center; margin: 30px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 Thank You for Choosing HNDY!</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${customerName},</h2>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #16a34a;">Your Request Has Been Received! 🎉</h3>
              <p>We've successfully received your service request and our team is already reviewing it.</p>
              <p style="margin-bottom: 0;"><strong>Request ID:</strong> <span class="status-badge">${request.id}</span></p>
            </div>

            ${isNewCustomer ? `
            <div class="account-box">
              <h3>🔐 Account Created!</h3>
              <p><strong>Important:</strong> We've created a customer account for you to track your requests.</p>
              <p>📧 <strong>Check your email</strong> for a separate message with instructions to set your password.</p>
              <p style="margin-bottom: 0;">Once your password is set, you can:</p>
              <ul style="margin-top: 8px; margin-bottom: 0;">
                <li>Track this request and all future requests</li>
                <li>View quotes and pay online</li>
                <li>Schedule appointments</li>
                <li>View service history</li>
              </ul>
            </div>
            ` : ''}

            <div class="info-box">
              <h3 style="margin-top: 0;">What Happens Next?</h3>
              <div class="timeline">
                <div class="timeline-item">
                  <strong>Within 24 Hours</strong><br>
                  You'll receive a detailed quote for your service
                </div>
                <div class="timeline-item">
                  <strong>After Quote Approval</strong><br>
                  We'll schedule your service at a convenient time
                </div>
                <div class="timeline-item">
                  <strong>Service Day</strong><br>
                  Our professional handyman will fix your issue
                </div>
              </div>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Your Request Details</h3>
              <p><strong>Service Address:</strong><br>${request.address}</p>
              ${(request.problem_description || request.problemDescription) ? `<p><strong>Problem Description:</strong><br>${request.problem_description || request.problemDescription}</p>` : ''}
              ${request.files && request.files.length > 0 ? `<p><strong>Attached Files:</strong> ${request.files.length} files uploaded</p>` : ''}
            </div>

            ${!isNewCustomer ? `
            <div class="button-container">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal" style="height:48px;v-text-anchor:middle;width:180px;" arcsize="17%" stroke="f" fillcolor="#a3e635">
                <w:anchorlock/>
                <center>
              <![endif]-->
              <a href="${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal" 
                 style="background-color:#a3e635;border-radius:8px;color:#000000;display:inline-block;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;line-height:48px;text-align:center;text-decoration:none;width:180px;-webkit-text-size-adjust:none;mso-hide:all;"
                 target="_blank">Track Your Request</a>
              <!--[if mso]>
                </center>
              </v:roundrect>
              <![endif]-->
              <div style="margin-top: 15px;">
                <p style="color: #666; font-size: 12px; margin: 5px 0;">
                  <em>Having trouble? Visit:</em>
                </p>
                <p style="margin: 5px 0;">
                  <a href="${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal" 
                     style="color: #16a34a; text-decoration: underline; word-break: break-all; font-size: 14px;" 
                     target="_blank">
                    ${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal
                  </a>
                </p>
              </div>
            </div>
            ` : `
            <div class="info-box" style="background: #fef3c7; border: 1px solid #fbbf24;">
              <h3 style="margin-top: 0; color: #92400e;">📱 Track Your Request</h3>
              <p>Once you've set your password (check your email), you can track this request in your customer portal.</p>
              <p style="margin-bottom: 0;">
                <strong>Portal URL:</strong> 
                <a href="${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal" 
                   style="color: #16a34a; text-decoration: underline;" 
                   target="_blank">
                  ${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal
                </a>
              </p>
            </div>
            `}

            <p style="color: #666; font-size: 14px;">
              <strong>Need to make changes?</strong> Simply reply to this email${isNewCustomer ? ' or set up your account to' : ' or access your customer portal to'} view and manage your request.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© HNDY - Your Trusted Handyman Service</p>
            <p style="margin: 0; font-size: 12px;">This email was sent to ${request.customer_email || request.customerEmail} regarding request ${request.id}</p>
          </div>
        </div>
      </body>
      </html>
    `
    }),

    // Quote Ready Email
    quoteReady: (request) => ({
        subject: `💰 Your HNDY Quote is Ready - $${request.quote} for Request ${request.id}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; background: #f9f9f9; }
          .quote-box { background: white; padding: 30px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
          .quote-amount { font-size: 48px; color: #16a34a; font-weight: bold; margin: 20px 0; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Your Quote is Ready!</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${request.customer_name || request.customerName},</h2>
            
            <p>Great news! We've reviewed your service request and prepared a quote for you.</p>

            <div class="quote-box">
              <h3 style="margin-top: 0; color: #333;">Your Service Quote</h3>
              <div class="quote-amount">$${request.quote}</div>
              <p style="color: #666; margin-bottom: 0;">for Request ${request.id}</p>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Service Details</h3>
              <p><strong>Address:</strong> ${request.address}</p>
              ${(request.problem_description || request.problemDescription) ? `<p><strong>Issue:</strong> ${request.problem_description || request.problemDescription}</p>` : ''}
              ${request.notes ? `<p><strong>Our Notes:</strong> ${request.notes}</p>` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal" style="height:52px;v-text-anchor:middle;width:200px;" arcsize="15%" stroke="f" fillcolor="#16a34a">
                <w:anchorlock/>
                <center>
              <![endif]-->
              <a href="${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal" 
                 style="background-color:#16a34a;border-radius:8px;color:#ffffff;display:inline-block;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;line-height:52px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;mso-hide:all;"
                 target="_blank">Accept Quote & Pay</a>
              <!--[if mso]>
                </center>
              </v:roundrect>
              <![endif]-->
              <div style="margin-top: 20px;">
                <p style="color: #666; font-size: 14px; margin: 10px 0;">
                  <em>Can't click the button? Copy and paste this link into your browser:</em>
                </p>
                <p style="margin: 10px 0;">
                  <a href="${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal" 
                     style="color: #16a34a; text-decoration: underline; word-break: break-all;" 
                     target="_blank">
                    ${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal
                  </a>
                </p>
              </div>
            </div>

            <div class="info-box" style="background: #fef3c7; border: 1px solid #fbbf24;">
              <h3 style="margin-top: 0; color: #92400e;">What's Next?</h3>
              <ol style="margin-bottom: 0;">
                <li>Review the quote in your customer portal</li>
                <li>Click "Pay Now" to accept and pay securely</li>
                <li>We'll schedule your service immediately after payment</li>
              </ol>
            </div>

            <p style="color: #666; font-size: 14px;">
              <strong>Questions about this quote?</strong> Reply to this email or call us. We're happy to discuss the work needed.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© HNDY - Your Trusted Handyman Service</p>
            <p style="margin: 0; font-size: 12px;">Quote valid for 30 days from ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
    }),

    // Payment Confirmation Email
    paymentConfirmation: (request, paymentAmount) => ({
        subject: `✅ Payment Received - HNDY Request ${request.id} Approved!`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; background: #f9f9f9; }
          .success-box { background: #d1fae5; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #10b981; text-align: center; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .receipt { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .receipt-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Confirmed!</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Thank you, ${request.customer_name || request.customerName},</h2>
            
            <div class="success-box">
              <h3 style="margin: 0 0 10px 0; color: #059669;">Your payment has been successfully processed!</h3>
              <p style="margin: 0;">We'll contact you shortly to schedule your service.</p>
            </div>

            <div class="receipt">
              <h3 style="margin-top: 0;">Payment Receipt</h3>
              <div class="receipt-row">
                <span>Request ID:</span>
                <span>${request.id}</span>
              </div>
              <div class="receipt-row">
                <span>Service:</span>
                <span>Handyman Service</span>
              </div>
              <div class="receipt-row">
                <span>Payment Date:</span>
                <span>${new Date().toLocaleDateString()}</span>
              </div>
              <div class="receipt-row" style="color: #10b981;">
                <span>Amount Paid:</span>
                <span>$${paymentAmount}</span>
              </div>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">What Happens Next?</h3>
              <ul>
                <li>Our team will contact you within 24 hours to schedule your service</li>
                <li>You'll receive a confirmation once your appointment is set</li>
                <li>On service day, you'll get a notification when our handyman is on the way</li>
              </ul>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Service Details</h3>
              <p><strong>Address:</strong> ${request.address}</p>
              ${(request.problem_description || request.problemDescription) ? `<p><strong>Issue:</strong> ${request.problem_description || request.problemDescription}</p>` : ''}
            </div>

            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              Need to reschedule or have questions? Reply to this email or access your customer portal.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© HNDY - Your Trusted Handyman Service</p>
            <p style="margin: 0; font-size: 12px;">This receipt was sent to ${request.customer_email || request.customerEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `
    }),

    // Refund Confirmation Email
    refundConfirmation: (request, refundAmount) => ({
        subject: `💸 Refund Processed - HNDY Request ${request.id}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; background: #f9f9f9; }
          .refund-box { background: #fee2e2; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #ef4444; text-align: center; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .receipt { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💸 Refund Processed</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${request.customer_name || request.customerName},</h2>
            
            <div class="refund-box">
              <h3 style="margin: 0 0 10px 0; color: #dc2626;">Your refund has been processed</h3>
              <p style="margin: 0; font-size: 24px; font-weight: bold;">$${refundAmount}</p>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Refund Details</h3>
              <p><strong>Request ID:</strong> ${request.id}</p>
              <p><strong>Refund Amount:</strong> $${refundAmount}</p>
              <p><strong>Processing Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin-bottom: 0;"><strong>Expected Arrival:</strong> 5-10 business days</p>
            </div>

            <div class="info-box" style="background: #fef3c7; border: 1px solid #fbbf24;">
              <p style="margin: 0;">
                <strong>Please Note:</strong> Refunds typically appear in your account within 5-10 business days, 
                depending on your bank's processing time.
              </p>
            </div>

            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              We're sorry things didn't work out this time. If you have any questions about this refund, 
              please don't hesitate to contact us.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© HNDY - Your Trusted Handyman Service</p>
            <p style="margin: 0; font-size: 12px;">This confirmation was sent to ${request.customer_email || request.customerEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `
    }),

    // Service Scheduled Email
    serviceScheduled: (request, appointmentDate) => ({
        subject: `📅 Service Scheduled - HNDY Request ${request.id}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; background: #f9f9f9; }
          .appointment-box { background: white; padding: 30px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; border: 2px solid #8b5cf6; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Your Service is Scheduled!</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${request.customer_name || request.customerName},</h2>
            
            <div class="appointment-box">
              <h3 style="margin: 0 0 10px 0; color: #7c3aed;">Appointment Confirmed</h3>
              <p style="font-size: 24px; font-weight: bold; color: #333; margin: 20px 0;">
                ${new Date(appointmentDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}
              </p>
              <p style="font-size: 20px; color: #666; margin: 0;">
                ${new Date(appointmentDate).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })}
              </p>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Service Details</h3>
              <p><strong>Request ID:</strong> ${request.id}</p>
              <p><strong>Address:</strong> ${request.address}</p>
              ${(request.problem_description || request.problemDescription) ? `<p><strong>Issue:</strong> ${request.problem_description || request.problemDescription}</p>` : ''}
              <p><strong>Service Fee:</strong> $${request.quote}</p>
            </div>

            <div class="info-box" style="background: #f0fdf4; border: 1px solid #16a34a;">
              <h3 style="margin-top: 0; color: #16a34a;">Appointment Day Checklist</h3>
              <ul style="margin-bottom: 0;">
                <li>Ensure someone is home to provide access</li>
                <li>Clear the work area for easy access</li>
                <li>Have any relevant information ready for the handyman</li>
                <li>We'll notify you when the handyman is on the way</li>
              </ul>
            </div>

            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              Need to reschedule? Reply to this email or access your customer portal at least 24 hours before your appointment.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© HNDY - Your Trusted Handyman Service</p>
            <p style="margin: 0; font-size: 12px;">We'll see you on ${new Date(appointmentDate).toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
    }),

    // Service Completed Email
    serviceCompleted: (request) => ({
        subject: `🎉 Service Completed - Thank You for Choosing HNDY!`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; background: #f9f9f9; }
          .success-box { background: #d1fae5; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #10b981; text-align: center; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Service Complete!</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Thank you, ${request.customer_name || request.customerName}!</h2>
            
            <div class="success-box">
              <h3 style="margin: 0 0 10px 0; color: #059669;">Your service has been completed!</h3>
              <p style="margin: 0;">We hope everything was fixed to your satisfaction.</p>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Service Summary</h3>
              <p><strong>Request ID:</strong> ${request.id}</p>
              <p><strong>Service Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Address:</strong> ${request.address}</p>
              ${(request.problem_description || request.problemDescription) ? `<p><strong>Issue Fixed:</strong> ${request.problem_description || request.problemDescription}</p>` : ''}
            </div>

            <div class="info-box" style="background: #fef3c7; border: 1px solid #fbbf24; text-align: center;">
              <h3 style="margin-top: 0;">How was your experience?</h3>
              <p>Your feedback helps us improve our service!</p>
              <div style="margin: 20px 0;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal" style="height:48px;v-text-anchor:middle;width:180px;" arcsize="17%" stroke="f" fillcolor="#a3e635">
                  <w:anchorlock/>
                  <center>
                <![endif]-->
                <a href="${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal" 
                   style="background-color:#a3e635;border-radius:8px;color:#000000;display:inline-block;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;line-height:48px;text-align:center;text-decoration:none;width:180px;-webkit-text-size-adjust:none;mso-hide:all;"
                   target="_blank">Rate Your Service</a>
                <!--[if mso]>
                  </center>
                </v:roundrect>
                <![endif]-->
              </div>
              <p style="color: #666; font-size: 12px; margin: 10px 0;">
                <em>Or visit:</em> 
                <a href="${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal" 
                   style="color: #16a34a; text-decoration: underline; word-break: break-all;" 
                   target="_blank">
                  ${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/customer-portal
                </a>
              </p>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Need Something Else Fixed?</h3>
              <p style="margin-bottom: 0;">
                We're always here to help! Submit a new request anytime through our app or website.
              </p>
            </div>

            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              Thank you for choosing HNDY. We appreciate your business!
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© HNDY - Your Trusted Handyman Service</p>
            <p style="margin: 0; font-size: 12px;">We'd love to serve you again!</p>
          </div>
        </div>
      </body>
      </html>
    `
    })
};

module.exports = emailTemplates;
