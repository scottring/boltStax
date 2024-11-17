import { collection, doc, updateDoc, deleteDoc, setDoc, getDoc, arrayUnion, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { SupplierInvite } from '../types/supplier';
import { sendEmail } from './email';
import { v4 as uuidv4 } from 'uuid';

const COMPANIES_COLLECTION = 'companies';
const INVITES_COLLECTION = 'invites';

export const inviteSupplier = async (invite: SupplierInvite, companyId: string): Promise<void> => {
  let inviteCode;
  
  try {
    const now = new Date();
    inviteCode = uuidv4(); // Generate unique invite code

    // Store invitation data in invites collection
    await setDoc(doc(db, INVITES_COLLECTION, inviteCode), {
      invitingCompanyId: companyId,
      email: invite.primaryContact,
      name: invite.name,
      contactName: invite.contactName,
      createdAt: Timestamp.fromDate(now),
      status: 'pending',
      role: 'supplier',
      notes: invite.notes
    });

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
      if (inviteCode) {
        await deleteDoc(doc(db, INVITES_COLLECTION, inviteCode));
      }
      throw emailError;
    }
  } catch (error) {
    // Clean up on any error
    if (inviteCode) {
      await deleteDoc(doc(db, INVITES_COLLECTION, inviteCode));
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
