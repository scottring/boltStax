import { collection, addDoc, query, where, orderBy, Timestamp, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Notification {
  id: string;
  recipientId: string;
  type: 'request' | 'submission' | 'review' | 'clarification' | 'approval' | 'reminder';
  title: string;
  message: string;
  relatedId?: string; // ID of related item (questionnaire, submission, etc.)
  read: boolean;
  createdAt: Date;
}

const NOTIFICATIONS_COLLECTION = 'notifications';

export const createNotification = async (
  notification: Omit<Notification, 'id' | 'read' | 'createdAt'>
): Promise<string> => {
  try {
    const notificationData = {
      ...notification,
      read: false,
      createdAt: Timestamp.fromDate(new Date())
    };

    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
    throw new Error('Failed to create notification');
  }
};

export const getUnreadNotifications = async (recipientId: string): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('recipientId', '==', recipientId),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Notification[];
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch unread notifications: ${error.message}`);
    }
    throw new Error('Failed to fetch unread notifications');
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
    throw new Error('Failed to mark notification as read');
  }
};

// Notification creation helpers for specific workflow events
export const notifySupplierInvitation = async (
  supplierId: string,
  supplierName: string,
  supplierEmail: string
): Promise<void> => {
  await createNotification({
    recipientId: supplierId,
    type: 'request',
    title: 'New Supplier Invitation',
    message: `${supplierName} (${supplierEmail}) has been invited to join the platform.`,
  });
};

export const notifyQuestionnaireRequest = async (
  supplierId: string,
  questionnaireId: string,
  questionnaireName: string
): Promise<void> => {
  await createNotification({
    recipientId: supplierId,
    type: 'request',
    title: 'New Questionnaire Request',
    message: `You have received a new questionnaire request: ${questionnaireName}`,
    relatedId: questionnaireId
  });
};

export const notifySubmissionReceived = async (
  customerId: string,
  supplierId: string,
  questionnaireId: string,
  supplierName: string
): Promise<void> => {
  await createNotification({
    recipientId: customerId,
    type: 'submission',
    title: 'New Questionnaire Submission',
    message: `${supplierName} has submitted their response to the questionnaire.`,
    relatedId: questionnaireId
  });
};

export const notifyClarificationRequest = async (
  supplierId: string,
  questionnaireId: string,
  questionnaireName: string
): Promise<void> => {
  await createNotification({
    recipientId: supplierId,
    type: 'clarification',
    title: 'Clarification Requested',
    message: `Additional clarification has been requested for questionnaire: ${questionnaireName}`,
    relatedId: questionnaireId
  });
};

export const notifySubmissionApproved = async (
  supplierId: string,
  questionnaireId: string,
  questionnaireName: string
): Promise<void> => {
  await createNotification({
    recipientId: supplierId,
    type: 'approval',
    title: 'Submission Approved',
    message: `Your submission for ${questionnaireName} has been approved.`,
    relatedId: questionnaireId
  });
};

export const notifyDeadlineReminder = async (
  supplierId: string,
  questionnaireId: string,
  questionnaireName: string,
  daysRemaining: number
): Promise<void> => {
  await createNotification({
    recipientId: supplierId,
    type: 'reminder',
    title: 'Submission Deadline Reminder',
    message: `The questionnaire "${questionnaireName}" is due in ${daysRemaining} days.`,
    relatedId: questionnaireId
  });
};
