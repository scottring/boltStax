import { collection, doc, updateDoc, deleteDoc, setDoc, getDoc, arrayUnion, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { SupplierInvite } from '../types/supplier';
import { sendEmail } from './email';
import { v4 as uuidv4 } from 'uuid';

const COMPANIES_COLLECTION = 'companies';
const INVITES_COLLECTION = 'invites';

interface InviteResult {
  inviteCode: string;
  supplierCompanyId: string;
}

export const inviteSupplier = async (invite: SupplierInvite, companyId: string): Promise<InviteResult> => {
  let inviteCode;
  let supplierCompanyId;
  
  try {
    const now = new Date();
    inviteCode = uuidv4(); // Generate unique invite code
    supplierCompanyId = uuidv4(); // Generate unique company ID for the supplier

    const batch = writeBatch(db);

    // Store invitation data in invites collection
    const inviteRef = doc(db, INVITES_COLLECTION, inviteCode);
    batch.set(inviteRef, {
      invitingCompanyId: companyId,
      supplierCompanyId: supplierCompanyId, // Store the supplier company ID with the invite
      email: invite.primaryContact,
      name: invite.name,
      contactName: invite.contactName,
      createdAt: Timestamp.fromDate(now),
      status: 'pending',
      role: 'supplier',
      notes: invite.notes,
      tags: invite.tags // Store the tags with the invitation
    });

    // Create supplier company record with pending status
    const supplierRef = doc(db, COMPANIES_COLLECTION, supplierCompanyId);
    batch.set(supplierRef, {
      name: invite.name,
      contactName: invite.contactName,
      email: invite.primaryContact,
      status: 'pending_invitation',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      notes: invite.notes,
      tags: invite.tags,
      suppliers: [],
      customers: [companyId], // Add the inviting company as a customer
      taskProgress: 0,
      pendingRequests: 0,
      completedRequests: 0
    });

    // Add supplier to inviting company's suppliers array
    const invitingCompanyRef = doc(db, COMPANIES_COLLECTION, companyId);
    batch.update(invitingCompanyRef, {
      suppliers: arrayUnion(supplierCompanyId),
      updatedAt: Timestamp.fromDate(now)
    });

    // Commit all the changes
    await batch.commit();

    // Generate invitation URL with the invite code
    const inviteUrl = `${window.location.origin}/signup?invite=${inviteCode}`;

    // Send invitation email
    try {
      await sendEmail({
        to: invite.primaryContact,
        template: 'SUPPLIER_INVITATION',
        data: {
          contactName: invite.contactName,
          companyName: invite.name,
          accessUrl: inviteUrl
        }
      });
    } catch (emailError) {
      // Clean up if email fails
      const cleanupBatch = writeBatch(db);
      cleanupBatch.delete(inviteRef);
      cleanupBatch.delete(supplierRef);
      cleanupBatch.update(invitingCompanyRef, {
        suppliers: arrayUnion(supplierCompanyId),
        updatedAt: Timestamp.fromDate(now)
      });
      await cleanupBatch.commit();
      throw emailError;
    }

    return { inviteCode, supplierCompanyId };
  } catch (error) {
    // Clean up on any error
    if (inviteCode || supplierCompanyId) {
      const cleanupBatch = writeBatch(db);
      if (inviteCode) {
        cleanupBatch.delete(doc(db, INVITES_COLLECTION, inviteCode));
      }
      if (supplierCompanyId) {
        cleanupBatch.delete(doc(db, COMPANIES_COLLECTION, supplierCompanyId));
        // Remove supplier from inviting company's suppliers array
        cleanupBatch.update(doc(db, COMPANIES_COLLECTION, companyId), {
          suppliers: arrayUnion(supplierCompanyId),
          updatedAt: Timestamp.fromDate(new Date())
        });
      }
      await cleanupBatch.commit();
    }
    console.error('Error inviting supplier:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to invite supplier: ${error.message}`);
    }
    throw new Error('Failed to invite supplier');
  }
};

export const getInviteData = async (inviteCode: string) => {
  try {
    const inviteDocRef = doc(db, INVITES_COLLECTION, inviteCode);
    const inviteSnapshot = await getDoc(inviteDocRef);
    
    if (!inviteSnapshot.exists()) {
      throw new Error('Invalid invitation code');
    }

    return inviteSnapshot.data();
  } catch (error) {
    console.error('Error fetching invite data:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch invite data: ${error.message}`);
    }
    throw new Error('Failed to fetch invite data');
  }
};

export const addSupplierToCompany = async (customerCompanyId: string, supplierCompanyId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const customerRef = doc(db, COMPANIES_COLLECTION, customerCompanyId);
    const supplierRef = doc(db, COMPANIES_COLLECTION, supplierCompanyId);

    // Add supplier to customer's suppliers array
    batch.update(customerRef, {
      suppliers: arrayUnion(supplierCompanyId),
      updatedAt: Timestamp.now()
    });

    // Add customer to supplier's customers array
    batch.update(supplierRef, {
      customers: arrayUnion(customerCompanyId),
      updatedAt: Timestamp.now()
    });

    await batch.commit();
  } catch (error) {
    console.error('Error adding supplier relationship:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to add supplier relationship: ${error.message}`);
    }
    throw new Error('Failed to add supplier relationship');
  }
};
