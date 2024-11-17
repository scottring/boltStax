"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const params_1 = require("firebase-functions/params");
admin.initializeApp();
// Define secrets
const sendgridKey = (0, params_1.defineSecret)('SENDGRID_KEY');
const sendgridFromEmail = (0, params_1.defineSecret)('SENDGRID_FROM_EMAIL');
// Function configuration
const functionConfig = {
    memory: '256MiB',
    timeoutSeconds: 30,
    cors: true,
    maxInstances: 10,
    secrets: [sendgridKey, sendgridFromEmail]
};
const emailTemplates = {
    SUPPLIER_INVITATION: {
        subject: 'Invitation to Join BoltStax',
        html: (data) => `
      <h2>Hello ${data.contactName},</h2>
      <p>You have been invited to join BoltStax as a supplier for ${data.companyName}.</p>
      <p>Click the link below to create your account and get started:</p>
      <a href="${data.accessUrl}" style="display:inline-block;background:#4CAF50;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
        Accept Invitation
      </a>
      <p>If you have any questions, please contact your account manager.</p>
    `
    },
    SHEET_CREATED: {
        subject: 'New Product Sheet Questionnaire',
        html: (data) => `
      <h2>Hello ${data.supplierName},</h2>
      <p>A new product sheet questionnaire "${data.sheetName}" has been created for you to complete.</p>
      ${data.dueDate ? `<p>Please complete it by: ${data.dueDate}</p>` : ''}
      <p>Click the link below to access the questionnaire:</p>
      <a href="${data.accessUrl}" style="display:inline-block;background:#4CAF50;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
        Access Questionnaire
      </a>
      <p>If you have any questions, please contact your account manager.</p>
    `
    },
    SHEET_REMINDER: {
        subject: 'Reminder: Product Sheet Questionnaire Due Soon',
        html: (data) => `
      <h2>Hello ${data.supplierName},</h2>
      <p>This is a reminder that the product sheet questionnaire "${data.sheetName}" is due soon.</p>
      <p>Due date: ${data.dueDate}</p>
      <p>Click the link below to complete the questionnaire:</p>
      <a href="${data.accessUrl}" style="display:inline-block;background:#4CAF50;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
        Complete Questionnaire
      </a>
    `
    },
    SHEET_SUBMITTED: {
        subject: 'Product Sheet Questionnaire Submitted',
        html: (data) => `
      <h2>Product Sheet Submitted</h2>
      <p>The product sheet "${data.sheetName}" has been submitted by ${data.supplierName}.</p>
      <p>Click below to review the responses:</p>
      <a href="${data.accessUrl}" style="display:inline-block;background:#4CAF50;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
        View Responses
      </a>
    `
    }
};
exports.sendEmail = (0, https_1.onCall)(functionConfig, async (request) => {
    try {
        const data = request.data;
        // Get SendGrid configuration from secrets
        const key = sendgridKey.value();
        const fromEmail = sendgridFromEmail.value();
        // Validate SendGrid configuration
        if (!key || !fromEmail) {
            console.error('Missing SendGrid configuration:', {
                hasKey: !!key,
                hasFromEmail: !!fromEmail
            });
            throw new Error('SendGrid configuration is missing');
        }
        // Validate input data
        if (!data.to || !data.template || !data.data) {
            console.error('Missing required email data:', {
                hasTo: !!data.to,
                hasTemplate: !!data.template,
                hasData: !!data.data
            });
            throw new Error('Missing required email data');
        }
        // Get template
        const template = emailTemplates[data.template];
        if (!template) {
            throw new Error('Invalid email template');
        }
        // Validate email address
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.to)) {
            throw new Error('Invalid recipient email address');
        }
        // Configure SendGrid
        sgMail.setApiKey(key);
        // Prepare email message
        const msg = {
            to: data.to,
            from: {
                email: fromEmail,
                name: 'BoltStax'
            },
            subject: template.subject,
            html: template.html(data.data),
            mailSettings: {
                sandboxMode: {
                    enable: false
                }
            }
        };
        // Send email asynchronously without waiting for response
        sgMail.send(msg)
            .then(([response]) => {
            console.log('SendGrid send successful:', {
                statusCode: response.statusCode,
                messageId: response.headers['x-message-id'],
            });
        })
            .catch(error => {
            var _a;
            console.error('SendGrid send error:', {
                error: error,
                response: (_a = error.response) === null || _a === void 0 ? void 0 : _a.body,
                code: error.code,
                message: error.message
            });
        });
        // Return success immediately
        return { success: true };
    }
    catch (error) {
        console.error('Error in sendEmail function:', {
            error: error,
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        throw new Error(error instanceof Error ? error.message : 'Failed to send email');
    }
});
//# sourceMappingURL=index.js.map