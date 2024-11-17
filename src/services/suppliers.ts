import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  DocumentData,
  where,
  query
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COMPANIES_COLLECTION = 'companies';

interface Company {
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

const convertFromFirestoreData = (id: string, data: DocumentData): Company => ({
  id,
  name: data.name,
  contactName: data.contactName,
  email: data.email,
  suppliers: data.suppliers || [],
  customers: data.customers || [],
  createdAt: data.createdAt.toDate(),
  updatedAt: data.updatedAt?.toDate(),
  notes: data.notes
});

export const getSupplier = async (companyId: string): Promise<Company> => {
  try {
    const docRef = doc(db, COMPANIES_COLLECTION, companyId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Company not found');
    }

    return convertFromFirestoreData(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('Error fetching company:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch company: ${error.message}`);
    }
    throw new Error('Failed to fetch company');
  }
};

export const getSuppliers = async (companyId: string): Promise<Company[]> => {
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
      convertFromFirestoreData(doc.id, doc.data())
    );
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch suppliers: ${error.message}`);
    }
    throw new Error('Failed to fetch suppliers');
  }
};
