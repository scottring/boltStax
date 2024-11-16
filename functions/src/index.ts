import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

admin.initializeApp();

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
    subject: 'Invitation to Join BoltStax',
    html: (data: EmailData['data']) => `
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

export const sendEmail = onCall<EmailData>(async (request) => {
  try {
    const data = request.data;
    
    // Initialize SendGrid with the API key from environment variables
    const sendgridKey = process.env.SENDGRID_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    // Validate SendGrid configuration
    if (!sendgridKey || !fromEmail) {
      console.error('Missing SendGrid configuration:', { 
        hasKey: !!sendgridKey, 
        hasFromEmail: !!fromEmail 
      });
      throw new Error('SendGrid configuration is missing');
    }

    sgMail.setApiKey(sendgridKey);

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

    console.log('Sending email:', {
      to: data.to,
      template: data.template,
      data: { ...data.data, accessUrl: '[REDACTED]' }
    });

    // Send email
    const msg = {
      to: data.to,
      from: fromEmail,
      subject: template.subject,
      html: template.html(data.data),
    };

    await sgMail.send(msg);
    
    console.log('Email sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('SendGrid API Error:', {
        statusCode: error.response.statusCode,
        body: error.response.body,
        headers: error.response.headers
      });
    }
    
    throw new Error(error instanceof Error ? error.message : 'Failed to send email');
  }
});
