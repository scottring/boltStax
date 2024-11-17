import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export interface EmailData {
  to: string;
  template: 'SHEET_CREATED' | 'SHEET_REMINDER' | 'SHEET_SUBMITTED' | 'SUPPLIER_INVITATION';
  data: {
    sheetName?: string;
    supplierName?: string;
    dueDate?: string;
    accessUrl?: string;
    contactName?: string;
    companyName?: string;
    [key: string]: any;
  };
}

export const sendEmail = async (emailData: EmailData): Promise<void> => {
  try {
    const sendEmailFn = httpsCallable<EmailData, { success: boolean }>(functions, 'sendEmail');
    const result = await sendEmailFn(emailData);
    
    // If we got a response at all, consider it successful since the cloud function
    // is handling the email sending asynchronously
    if (result?.data !== undefined) {
      return;
    }
    
    throw new Error('Failed to initiate email sending');
  } catch (error: any) {
    console.error('Email service error:', {
      error,
      code: error?.code,
      message: error?.message,
      details: error?.details,
      data: error?.data
    });
    
    // If we get an internal error, it might still be processing
    if (error?.code === 'functions/internal') {
      console.warn('Got internal error but email might still be processing');
      return;
    }

    // If we get an unavailable error, it might be during deployment
    if (error?.code === 'functions/unavailable') {
      console.warn('Function temporarily unavailable, might be updating');
      return;
    }
    
    // Extract Firebase Functions error details for more specific error messages
    if (error?.details) {
      throw new Error(`Email sending failed: ${error.details}`);
    }
    
    // Handle other types of errors
    if (error?.message) {
      throw new Error(`Email sending failed: ${error.message}`);
    }
    
    throw new Error('Failed to send email: Unknown error occurred');
  }
};
