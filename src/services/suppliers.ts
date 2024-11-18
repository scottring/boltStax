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
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Supplier } from '../types/supplier';

const COMPANIES_COLLECTION = 'companies';

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
    // Create a query that searches for companies where name starts with the search term
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

// For general company relationships (used in CustomersProductsView)
export const getCompanySuppliers = async (companyId: string): Promise<Company[]> => {
  try {
    // First get the company document to get the suppliers array
    const companyDoc = await getDoc(doc(db, COMPANIES_COLLECTION, companyId));
    
    if (!companyDoc.exists()) {
      throw new Error('Company not found');
    }

    const supplierIds = companyDoc.data().suppliers || [];
    
    if (supplierIds.length === 0) {
      return [];
    }

    // Fetch all supplier companies
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

// For supplier-specific functionality (used in SupplierProductsView)
export const getSuppliers = async (companyId: string): Promise<Supplier[]> => {
  try {
    // First get the company document to get the suppliers array
    const companyDoc = await getDoc(doc(db, COMPANIES_COLLECTION, companyId));
    
    if (!companyDoc.exists()) {
      throw new Error('Company not found');
    }

    const supplierIds = companyDoc.data().suppliers || [];
    
    if (supplierIds.length === 0) {
      return [];
    }

    // Fetch all supplier companies
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
