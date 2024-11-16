import { 
  collection, 
  addDoc, 
  Timestamp,
  DocumentReference,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  updateDoc,
  doc,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type NotificationType = 
  | 'questionnaireAssigned'
  | 'questionnaireSubmitted'
  | 'supplierInvited'
  | 'supplierJoined';

interface BaseNotification {
  id?: string;
  type: NotificationType;
  timestamp: Timestamp;
  read?: boolean;
}

export interface QuestionnaireNotification extends BaseNotification {
  type: 'questionnaireAssigned' | 'questionnaireSubmitted';
  productSheetId: string;
  supplierId: string;
}

export interface SupplierNotification extends BaseNotification {
  type: 'supplierInvited' | 'supplierJoined';
  supplierId: string;
}

export type Notification = QuestionnaireNotification | SupplierNotification;

const NOTIFICATIONS_COLLECTION = 'notifications';
const EMAIL_QUEUE_COLLECTION = 'emailQueue';

interface EmailQueueItem {
  to: string;
  template: string;
  context: Record<string, any>;
  scheduledFor: Timestamp;
  sent?: boolean;
  error?: string;
}

function isQuestionnaireNotification(
  notification: Omit<Notification, 'id' | 'read'>
): notification is Omit<QuestionnaireNotification, 'id' | 'read'> {
  return (
    notification.type === 'questionnaireAssigned' ||
    notification.type === 'questionnaireSubmitted'
  );
}

function isSupplierNotification(
  notification: Omit<Notification, 'id' | 'read'>
): notification is Omit<SupplierNotification, 'id' | 'read'> {
  return (
    notification.type === 'supplierInvited' ||
    notification.type === 'supplierJoined'
  );
}

export const sendNotification = async (
  notification: Omit<Notification, 'id' | 'read'>
): Promise<DocumentReference> => {
  try {
    // Add notification to the notifications collection
    const notificationRef = await addDoc(
      collection(db, NOTIFICATIONS_COLLECTION), 
      {
        ...notification,
        read: false
      }
    );

    // Queue email notification
    let emailTemplate: string;
    let emailContext: Record<string, any>;

    if (isQuestionnaireNotification(notification)) {
      emailTemplate = notification.type === 'questionnaireAssigned' 
        ? 'questionnaire-assigned'
        : 'questionnaire-submitted';
      emailContext = {
        productSheetId: notification.productSheetId,
        supplierId: notification.supplierId
      };
    } else if (isSupplierNotification(notification)) {
      emailTemplate = notification.type === 'supplierInvited'
        ? 'supplier-invited'
        : 'supplier-joined';
      emailContext = {
        supplierId: notification.supplierId
      };
    } else {
      throw new Error('Invalid notification type');
    }

    // Add to email queue
    await addDoc(collection(db, EMAIL_QUEUE_COLLECTION), {
      template: emailTemplate,
      context: emailContext,
      scheduledFor: Timestamp.now(),
      sent: false
    } as EmailQueueItem);

    return notificationRef;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export const getUnreadNotifications = async (
  userId: string,
  limitCount?: number
): Promise<Notification[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('read', '==', false),
      orderBy('timestamp', 'desc')
    ];
    
    if (typeof limitCount === 'number') {
      constraints.push(firestoreLimit(limitCount));
    }

    const q = query(collection(db, NOTIFICATIONS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};
