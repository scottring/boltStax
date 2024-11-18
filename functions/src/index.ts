import { onCall, HttpsOptions } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();

// Define secrets
const sendgridKey = defineSecret('SENDGRID_KEY');
const sendgridFromEmail = defineSecret('SENDGRID_FROM_EMAIL');

// Function configuration
const functionConfig: HttpsOptions = {
  memory: '256MiB',
  timeoutSeconds: 30,
  cors: true,
  maxInstances: 10,
  secrets: [sendgridKey, sendgridFromEmail]
};

interface EmailData {
  to: string;
  template: 'SHEET_CREATED' | 'SHEET_REMINDER' | 'SHEET_SUBMITTED' | 'SUPPLIER_INVITATION';
  data: {
    sheetName?: string;
    supplierName?: string;
    dueDate?: string;
    accessUrl?: string;
    tempPassword?: string;
    contactName?: string;
    companyName?: string;
    [key: string]: any;
  };
}

const emailTemplates = {
  SUPPLIER_INVITATION: {
    subject: 'Invitation to Join StacksData',
    html: (data: EmailData['data']) => `
      <h2>Hello ${data.contactName},</h2>
      <p>You have been invited to join StacksData as a supplier for ${data.companyName}.</p>
      <p>Click the link below to create your account and get started:</p>
      <a href="${data.accessUrl}" style="display:inline-block;background:#4CAF50;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
        Accept Invitation
      </a>
      <p>If you have any questions, please contact your account manager.</p>
    `
  },
  SHEET_CREATED: {
    subject: 'New Product Sheet Questionnaire',
    html: (data: EmailData['data']) => `
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
    html: (data: EmailData['data']) => `
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
    html: (data: EmailData['data']) => `
      <h2>Product Sheet Submitted</h2>
      <p>The product sheet "${data.sheetName}" has been submitted by ${data.supplierName}.</p>
      <p>Click below to review the responses:</p>
      <a href="${data.accessUrl}" style="display:inline-block;background:#4CAF50;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
        View Responses
      </a>
    `
  }
};

export const sendEmail = onCall<EmailData>(functionConfig, async (request) => {
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
        name: 'StacksData'  // Changed from BoltStax to StacksData
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
        console.error('SendGrid send error:', {
          error: error,
          response: error.response?.body,
          code: error.code,
          message: error.message
        });
      });

    // Return success immediately
    return { success: true };
  } catch (error: any) {
    console.error('Error in sendEmail function:', {
      error: error,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    throw new Error(error instanceof Error ? error.message : 'Failed to send email');
  }
});
