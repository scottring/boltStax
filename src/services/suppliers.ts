import { collection, addDoc, getDocs, query, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Supplier } from '../types/supplier';

const SUPPLIERS_COLLECTION = 'suppliers';

export const addSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
  try {
    // Create the supplier data with Firestore Timestamp
    const supplierData = {
      name: supplier.name,
      primaryContact: supplier.primaryContact,
      taskProgress: supplier.taskProgress,
      status: supplier.status,
      complianceScore: supplier.complianceScore,
      lastUpdated: Timestamp.fromDate(supplier.lastUpdated)
    };

    // Add to Firestore and get the document reference
    const docRef = await addDoc(collection(db, SUPPLIERS_COLLECTION), supplierData);

    // Return the complete supplier object with the Firestore-generated ID
    return {
      id: docRef.id,
      ...supplier,
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

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      primaryContact: data.primaryContact,
      taskProgress: data.taskProgress,
      status: data.status,
      complianceScore: data.complianceScore,
      lastUpdated: data.lastUpdated.toDate(),
    };
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
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        primaryContact: data.primaryContact,
        taskProgress: data.taskProgress,
        status: data.status,
        complianceScore: data.complianceScore,
        lastUpdated: data.lastUpdated.toDate(),
      };
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch suppliers: ${error.message}`);
    }
    throw new Error('Failed to fetch suppliers');
  }
};
