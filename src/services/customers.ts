import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  DocumentData,
  where,
  query,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Customer, CustomerInvite } from '../types/customer';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from './email';

const COMPANIES_COLLECTION = 'companies';
const INVITES_COLLECTION = 'invites';

const convertToCustomer = (id: string, data: DocumentData): Customer => ({
  id,
  name: data.name,
  contactName: data.contactName,
  primaryContact: data.email || data.primaryContact,
  status: data.status || 'inactive',
  taskProgress: data.taskProgress || 0,
  lastUpdated: data.updatedAt?.toDate() || data.lastUpdated?.toDate() || new Date(),
  invitationSentDate: data.invitationSentDate?.toDate(),
  registrationDate: data.registrationDate?.toDate(),
  lastLoginDate: data.lastLoginDate?.toDate(),
  pendingRequests: data.pendingRequests || 0,
  completedRequests: data.completedRequests || 0,
  tags: data.tags || [],
  notes: data.notes,
  purchasedProducts: data.purchasedProducts || []
});

export const searchCustomersByName = async (searchTerm: string): Promise<Customer[]> => {
  try {
    const companiesRef = collection(db, COMPANIES_COLLECTION);
    const searchTermLower = searchTerm.toLowerCase();
    
    const q = query(
      companiesRef,
      where('name', '>=', searchTermLower),
      where('name', '<=', searchTermLower + '\uf8ff'),
      orderBy('name'),
      limit(5)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => convertToCustomer(doc.id, doc.data()))
      .filter(company => company.name.toLowerCase().includes(searchTermLower));
  } catch (error) {
    console.error('Error searching customers:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to search customers: ${error.message}`);
    }
    throw new Error('Failed to search customers');
  }
};

export const getCustomer = async (companyId: string): Promise<Customer> => {
  try {
    const docRef = doc(db, COMPANIES_COLLECTION, companyId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Customer not found');
    }

    return convertToCustomer(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('Error fetching customer:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }
    throw new Error('Failed to fetch customer');
  }
};

export const getCustomers = async (companyId: string): Promise<Customer[]> => {
  try {
    // First get the company document to get the customers array
    const companyDoc = await getDoc(doc(db, COMPANIES_COLLECTION, companyId));
    
    if (!companyDoc.exists()) {
      throw new Error('Company not found');
    }

    const customerIds = companyDoc.data().customers || [];
    
    if (customerIds.length === 0) {
      return [];
    }

    // Fetch all customer companies
    const customersQuery = query(
      collection(db, COMPANIES_COLLECTION),
      where('__name__', 'in', customerIds)
    );
    
    const customersSnapshot = await getDocs(customersQuery);
    
    return customersSnapshot.docs.map(doc => 
      convertToCustomer(doc.id, doc.data())
    );
  } catch (error) {
    console.error('Error fetching customers:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }
    throw new Error('Failed to fetch customers');
  }
};

export const inviteCustomer = async (invite: CustomerInvite, companyId: string): Promise<void> => {
  let inviteCode;
  let customerCompanyId;
  
  try {
    const now = new Date();
    inviteCode = uuidv4();
    customerCompanyId = uuidv4();

    const batch = writeBatch(db);

    // Store invitation data in invites collection
    const inviteRef = doc(db, INVITES_COLLECTION, inviteCode);
    batch.set(inviteRef, {
      invitingCompanyId: companyId,
      customerCompanyId: customerCompanyId,
      email: invite.primaryContact,
      name: invite.name,
      contactName: invite.contactName,
      createdAt: Timestamp.fromDate(now),
      status: 'pending',
      role: 'customer',
      notes: invite.notes,
      tags: invite.tags
    });

    // Create customer company record with pending status
    const customerRef = doc(db, COMPANIES_COLLECTION, customerCompanyId);
    batch.set(customerRef, {
      name: invite.name,
      contactName: invite.contactName,
      email: invite.primaryContact,
      status: 'pending_invitation',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      notes: invite.notes,
      tags: invite.tags,
      suppliers: [companyId],  // Add the inviting company as a supplier
      customers: [],
      taskProgress: 0,
      pendingRequests: 0,
      completedRequests: 0,
      purchasedProducts: []
    });

    // Add customer to inviting company's customers array
    const invitingCompanyRef = doc(db, COMPANIES_COLLECTION, companyId);
    batch.update(invitingCompanyRef, {
      customers: arrayUnion(customerCompanyId),
      updatedAt: Timestamp.fromDate(now)
    });

    await batch.commit();

    // Generate invitation URL with the invite code
    const inviteUrl = `${window.location.origin}/signup?invite=${inviteCode}`;

    // Send invitation email
    try {
      await sendEmail({
        to: invite.primaryContact,
        template: 'SUPPLIER_INVITATION', // Using supplier template for now until customer template is added
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
      cleanupBatch.delete(customerRef);
      cleanupBatch.update(invitingCompanyRef, {
        customers: arrayUnion(customerCompanyId),
        updatedAt: Timestamp.fromDate(now)
      });
      await cleanupBatch.commit();
      throw emailError;
    }
  } catch (error) {
    // Clean up on any error
    if (inviteCode || customerCompanyId) {
      const cleanupBatch = writeBatch(db);
      if (inviteCode) {
        cleanupBatch.delete(doc(db, INVITES_COLLECTION, inviteCode));
      }
      if (customerCompanyId) {
        cleanupBatch.delete(doc(db, COMPANIES_COLLECTION, customerCompanyId));
        cleanupBatch.update(doc(db, COMPANIES_COLLECTION, companyId), {
          customers: arrayUnion(customerCompanyId),
          updatedAt: Timestamp.fromDate(new Date())
        });
      }
      await cleanupBatch.commit();
    }
    console.error('Error inviting customer:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to invite customer: ${error.message}`);
    }
    throw new Error('Failed to invite customer');
  }
};
