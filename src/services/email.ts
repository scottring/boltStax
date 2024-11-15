import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export interface EmailData {
  to: string;
  template: 'SHEET_CREATED' | 'SHEET_REMINDER' | 'SHEET_SUBMITTED';
  data: {
    sheetName?: string;
    supplierName?: string;
    dueDate?: string;
    accessUrl?: string;
    [key: string]: any;
  };
}

export const sendEmail = async (emailData: EmailData): Promise<void> => {
  try {
    const sendEmailFn = httpsCallable<EmailData, { success: boolean }>(functions, 'sendEmail');
    const result = await sendEmailFn(emailData);
    
    if (!result.data.success) {
      throw new Error('Email sending failed');
    }
  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // Extract Firebase Functions error details
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