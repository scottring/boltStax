import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  DocumentData,
  where,
  query,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Supplier } from '../types/supplier';

const COMPANIES_COLLECTION = 'companies';
const SUPPLIER_ANSWERS_COLLECTION = 'supplierAnswers';

export interface Company {
  id: string;
  name: string;
  contactName: string;
  email: string;
  suppliers: string[];
  customers: string[];
  createdAt: Date;
  updatedAt?: Date;
  notes?: string;
}

const convertToCompany = (id: string, data: DocumentData): Company => ({
  id,
  name: data.name,
  contactName: data.contactName,
  email: data.email || data.primaryContact,
  suppliers: data.suppliers || [],
  customers: data.customers || [],
  createdAt: data.createdAt?.toDate() || new Date(),
  updatedAt: data.updatedAt?.toDate(),
  notes: data.notes
});

const convertToSupplier = (id: string, data: DocumentData): Supplier => ({
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
  complianceScore: data.complianceScore,
  tags: data.tags || [],
  notes: data.notes,
  complianceHistory: (data.complianceHistory || []).map((record: any) => ({
    date: record.date.toDate(),
    score: record.score,
    category: record.category
  }))
});

export const searchCompaniesByName = async (searchTerm: string): Promise<Company[]> => {
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
      .map(doc => convertToCompany(doc.id, doc.data()))
      .filter(company => company.name.toLowerCase().includes(searchTermLower));
  } catch (error) {
    console.error('Error searching companies:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to search companies: ${error.message}`);
    }
    throw new Error('Failed to search companies');
  }
};

export const getSupplier = async (companyId: string): Promise<Supplier> => {
  try {
    const docRef = doc(db, COMPANIES_COLLECTION, companyId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Company not found');
    }

    return convertToSupplier(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('Error fetching company:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch company: ${error.message}`);
    }
    throw new Error('Failed to fetch company');
  }
};

export const updateSupplierStatus = async (supplierId: string, status: string): Promise<void> => {
  try {
    const docRef = doc(db, COMPANIES_COLLECTION, supplierId);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating supplier status:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to update supplier status: ${error.message}`);
    }
    throw new Error('Failed to update supplier status');
  }
};

export const saveSupplierAnswers = async (supplierId: string, answers: Record<string, string>): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Save answers
    const answersRef = doc(db, SUPPLIER_ANSWERS_COLLECTION, supplierId);
    batch.set(answersRef, {
      answers,
      updatedAt: Timestamp.now()
    });

    // Update supplier status
    const supplierRef = doc(db, COMPANIES_COLLECTION, supplierId);
    batch.update(supplierRef, {
      status: 'active',
      updatedAt: Timestamp.now()
    });

    await batch.commit();
  } catch (error) {
    console.error('Error saving supplier answers:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to save supplier answers: ${error.message}`);
    }
    throw new Error('Failed to save supplier answers');
  }
};

export const getCompanySuppliers = async (companyId: string): Promise<Company[]> => {
  try {
    const companyDoc = await getDoc(doc(db, COMPANIES_COLLECTION, companyId));
    
    if (!companyDoc.exists()) {
      throw new Error('Company not found');
    }

    const supplierIds = companyDoc.data().suppliers || [];
    
    if (supplierIds.length === 0) {
      return [];
    }

    const suppliersQuery = query(
      collection(db, COMPANIES_COLLECTION),
      where('__name__', 'in', supplierIds)
    );
    
    const suppliersSnapshot = await getDocs(suppliersQuery);
    
    return suppliersSnapshot.docs.map(doc => 
      convertToCompany(doc.id, doc.data())
    );
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch suppliers: ${error.message}`);
    }
    throw new Error('Failed to fetch suppliers');
  }
};

export const getSuppliers = async (companyId: string): Promise<Supplier[]> => {
  try {
    const companyDoc = await getDoc(doc(db, COMPANIES_COLLECTION, companyId));
    
    if (!companyDoc.exists()) {
      throw new Error('Company not found');
    }

    const supplierIds = companyDoc.data().suppliers || [];
    
    if (supplierIds.length === 0) {
      return [];
    }

    const suppliersQuery = query(
      collection(db, COMPANIES_COLLECTION),
      where('__name__', 'in', supplierIds)
    );
    
    const suppliersSnapshot = await getDocs(suppliersQuery);
    
    return suppliersSnapshot.docs.map(doc => 
      convertToSupplier(doc.id, doc.data())
    );
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch suppliers: ${error.message}`);
    }
    throw new Error('Failed to fetch suppliers');
  }
};

export const deleteSuppliers = async (supplierIds: string[]): Promise<{ count: number }> => {
  try {
    const batch = writeBatch(db);
    
    for (const supplierId of supplierIds) {
      // Delete from companies collection
      const companyRef = doc(db, COMPANIES_COLLECTION, supplierId);
      batch.delete(companyRef);

      // Delete their answers if they exist
      const answersRef = doc(db, SUPPLIER_ANSWERS_COLLECTION, supplierId);
      batch.delete(answersRef);
    }

    await batch.commit();
    return { count: supplierIds.length };
  } catch (error) {
    console.error('Error deleting suppliers:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete suppliers: ${error.message}`);
    }
    throw new Error('Failed to delete suppliers');
  }
};
