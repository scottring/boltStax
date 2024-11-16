import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { SupplierInvite, Supplier } from '../types/supplier';
import { sendEmail } from './email';

const SUPPLIERS_COLLECTION = 'suppliers';

const convertFromFirestoreData = (id: string, data: any): Supplier => ({
  id,
  name: data.name,
  contactName: data.contactName,
  primaryContact: data.primaryContact,
  taskProgress: data.taskProgress,
  status: data.status,
  complianceScore: data.complianceScore,
  lastUpdated: data.lastUpdated.toDate(),
  invitationSentDate: data.invitationSentDate?.toDate(),
  registrationDate: data.registrationDate?.toDate(),
  lastLoginDate: data.lastLoginDate?.toDate(),
  pendingRequests: data.pendingRequests,
  completedRequests: data.completedRequests,
  tags: data.tags,
  notes: data.notes,
  complianceHistory: data.complianceHistory.map((record: any) => ({
    date: record.date.toDate(),
    score: record.score,
    category: record.category
  }))
});

export const inviteSupplier = async (invite: SupplierInvite): Promise<Supplier> => {
  try {
    const now = new Date();
    const newSupplier = {
      ...invite,
      taskProgress: 0,
      status: 'pending_invitation' as const,
      lastUpdated: now,
      invitationSentDate: now,
      pendingRequests: 0,
      completedRequests: 0,
      tags: [],
      complianceScore: 0,
      complianceHistory: []
    };

    const supplierData = {
      ...newSupplier,
      lastUpdated: Timestamp.fromDate(now),
      invitationSentDate: Timestamp.fromDate(now)
    };

    // Create supplier record
    const docRef = await addDoc(collection(db, SUPPLIERS_COLLECTION), supplierData);
    
    // Generate invitation URL
    const inviteUrl = `${window.location.origin}?invite=${docRef.id}`;

    // Send invitation email
    await sendEmail({
      to: invite.primaryContact,
      template: 'SUPPLIER_INVITATION',
      data: {
        contactName: invite.contactName,
        companyName: invite.name,
        accessUrl: inviteUrl
      }
    });

    return {
      id: docRef.id,
      ...newSupplier
    };
  } catch (error) {
    console.error('Error inviting supplier:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to invite supplier: ${error.message}`);
    }
    throw new Error('Failed to invite supplier');
  }
};

export const getPendingInvitations = async (): Promise<Supplier[]> => {
  try {
    const q = query(
      collection(db, SUPPLIERS_COLLECTION),
      where('status', '==', 'pending_invitation'),
      orderBy('invitationSentDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => 
      convertFromFirestoreData(doc.id, doc.data())
    );
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch pending invitations: ${error.message}`);
    }
    throw new Error('Failed to fetch pending invitations');
  }
};

export const updateInvitationStatus = async (
  supplierId: string, 
  status: 'pending_invitation' | 'invitation_sent' | 'registered' | 'active' | 'inactive'
): Promise<void> => {
  try {
    const docRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
    const updateData: Record<string, any> = {
      status,
      lastUpdated: Timestamp.fromDate(new Date())
    };

    // Add registration date if supplier is being registered
    if (status === 'registered') {
      updateData.registrationDate = Timestamp.fromDate(new Date());
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating invitation status:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to update invitation status: ${error.message}`);
    }
    throw new Error('Failed to update invitation status');
  }
};
