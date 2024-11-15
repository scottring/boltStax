import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  Timestamp, 
  doc, 
  getDoc, 
  updateDoc,
  DocumentData 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Supplier, ComplianceRecord } from '../types/supplier';

const SUPPLIERS_COLLECTION = 'suppliers';

const convertToFirestoreData = (supplier: Omit<Supplier, 'id'>) => ({
  name: supplier.name,
  contactName: supplier.contactName,
  primaryContact: supplier.primaryContact,
  taskProgress: supplier.taskProgress,
  status: supplier.status,
  complianceScore: supplier.complianceScore,
  lastUpdated: Timestamp.fromDate(supplier.lastUpdated),
  invitationSentDate: supplier.invitationSentDate ? Timestamp.fromDate(supplier.invitationSentDate) : null,
  registrationDate: supplier.registrationDate ? Timestamp.fromDate(supplier.registrationDate) : null,
  lastLoginDate: supplier.lastLoginDate ? Timestamp.fromDate(supplier.lastLoginDate) : null,
  pendingRequests: supplier.pendingRequests,
  completedRequests: supplier.completedRequests,
  tags: supplier.tags,
  notes: supplier.notes,
  complianceHistory: supplier.complianceHistory.map(record => ({
    date: Timestamp.fromDate(record.date),
    score: record.score,
    category: record.category
  }))
});

const convertFromFirestoreData = (id: string, data: DocumentData): Supplier => ({
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
  tags: data.tags || [],
  notes: data.notes,
  complianceHistory: data.complianceHistory?.map((record: any) => ({
    date: record.date.toDate(),
    score: record.score,
    category: record.category
  })) || []
});

export const addSupplier = async (supplierData: Omit<Supplier, 'id'>): Promise<Supplier> => {
  try {
    const firestoreData = convertToFirestoreData(supplierData);
    const docRef = await addDoc(collection(db, SUPPLIERS_COLLECTION), firestoreData);
    return {
      id: docRef.id,
      ...supplierData
    };
  } catch (error) {
    console.error('Error adding supplier:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to add supplier: ${error.message}`);
    }
    throw new Error('Failed to add supplier');
  }
};

export const getSupplier = async (supplierId: string): Promise<Supplier> => {
  try {
    const docRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Supplier not found');
    }

    return convertFromFirestoreData(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('Error fetching supplier:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch supplier: ${error.message}`);
    }
    throw new Error('Failed to fetch supplier');
  }
};

export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    const q = query(collection(db, SUPPLIERS_COLLECTION), orderBy('lastUpdated', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => 
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

export const updateSupplier = async (supplierId: string, updates: Partial<Omit<Supplier, 'id'>>): Promise<void> => {
  try {
    const docRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
    const updateData: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value instanceof Date) {
        updateData[key] = Timestamp.fromDate(value);
      } else if (key === 'complianceHistory' && Array.isArray(value)) {
        updateData[key] = (value as ComplianceRecord[]).map(record => ({
          date: Timestamp.fromDate(record.date),
          score: record.score,
          category: record.category
        }));
      } else {
        updateData[key] = value;
      }
    });

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating supplier:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to update supplier: ${error.message}`);
    }
    throw new Error('Failed to update supplier');
  }
};
