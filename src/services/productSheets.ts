import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ProductSheet } from '../types/productSheet';
import { v4 as uuidv4 } from 'uuid';

const SHEETS_COLLECTION = 'productSheets';
const COMPANY_PRODUCTS_COLLECTION = 'companyProducts';

const convertToFirestoreData = (sheet: Omit<ProductSheet, 'id'>) => ({
  name: sheet.name,
  supplierId: sheet.supplierId,
  status: sheet.status,
  selectedTags: sheet.selectedTags,
  dueDate: sheet.dueDate ? Timestamp.fromDate(sheet.dueDate) : null,
  createdAt: Timestamp.fromDate(sheet.createdAt),
  updatedAt: Timestamp.fromDate(sheet.updatedAt),
  submittedAt: sheet.submittedAt ? Timestamp.fromDate(sheet.submittedAt) : null,
  accessToken: sheet.accessToken,
  responses: sheet.responses || {}
});

const convertFromFirestoreData = (id: string, data: DocumentData): ProductSheet => ({
  id,
  name: data.name,
  supplierId: data.supplierId,
  status: data.status,
  selectedTags: data.selectedTags || [],
  dueDate: data.dueDate?.toDate() || undefined,
  createdAt: data.createdAt.toDate(),
  updatedAt: data.updatedAt.toDate(),
  submittedAt: data.submittedAt?.toDate(),
  accessToken: data.accessToken,
  responses: data.responses
});

export const createProductSheet = async (
  companyId: string,
  sheetData: Omit<ProductSheet, 'id' | 'createdAt' | 'updatedAt' | 'accessToken'>
): Promise<ProductSheet> => {
  try {
    const now = new Date();
    const completeSheetData: Omit<ProductSheet, 'id'> = {
      ...sheetData,
      createdAt: now,
      updatedAt: now,
      accessToken: uuidv4()
    };
    
    const firestoreData = convertToFirestoreData(completeSheetData);
    
    // Add sheet to productSheets collection
    const sheetRef = await addDoc(collection(db, SHEETS_COLLECTION), firestoreData);
    
    // Create relationship in companyProducts collection
    await addDoc(
      collection(db, COMPANY_PRODUCTS_COLLECTION, companyId, 'products'),
      {
        productSheetId: sheetRef.id,
        addedAt: Timestamp.now()
      }
    );

    return {
      id: sheetRef.id,
      ...completeSheetData
    };
  } catch (error) {
    console.error('Error creating product sheet:', error);
    throw new Error('Failed to create product sheet');
  }
};

export const getAllSheets = async (companyId: string): Promise<ProductSheet[]> => {
  try {
    // Get all product sheet IDs for the company
    const companyProductsDocs = await getDocs(
      collection(db, COMPANY_PRODUCTS_COLLECTION, companyId, 'products')
    );
    
    const sheetIds = companyProductsDocs.docs.map(doc => doc.data().productSheetId);
    
    if (sheetIds.length === 0) {
      return [];
    }

    // Fetch all product sheets that match the IDs
    const sheetsQuery = query(
      collection(db, SHEETS_COLLECTION),
      where('__name__', 'in', sheetIds)
    );
    
    const sheetsSnapshot = await getDocs(sheetsQuery);
    
    return sheetsSnapshot.docs.map(doc => 
      convertFromFirestoreData(doc.id, doc.data())
    );
  } catch (error) {
    console.error('Error fetching product sheets:', error);
    throw new Error('Failed to fetch product sheets');
  }
};

export const getSheet = async (sheetId: string): Promise<ProductSheet> => {
  try {
    const docRef = doc(db, SHEETS_COLLECTION, sheetId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Product sheet not found');
    }

    return convertFromFirestoreData(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('Error fetching product sheet:', error);
    throw new Error('Failed to fetch product sheet');
  }
};

export const updateSheet = async (
  sheetId: string,
  updates: Partial<Omit<ProductSheet, 'id' | 'createdAt' | 'accessToken'>>
): Promise<void> => {
  try {
    const docRef = doc(db, SHEETS_COLLECTION, sheetId);
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    // Convert dates to Timestamps
    if (updates.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updates.dueDate);
    }
    if (updates.submittedAt) {
      updateData.submittedAt = Timestamp.fromDate(updates.submittedAt);
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating product sheet:', error);
    throw new Error('Failed to update product sheet');
  }
};

export const deleteSheet = async (sheetId: string, companyId: string): Promise<void> => {
  try {
    // Delete the sheet document
    await deleteDoc(doc(db, SHEETS_COLLECTION, sheetId));
    
    // Find and delete the company relationship
    const companyProductsQuery = query(
      collection(db, COMPANY_PRODUCTS_COLLECTION, companyId, 'products'),
      where('productSheetId', '==', sheetId)
    );
    
    const querySnapshot = await getDocs(companyProductsQuery);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting product sheet:', error);
    throw new Error('Failed to delete product sheet');
  }
};

export const sendSheet = async (sheetId: string): Promise<void> => {
  try {
    const docRef = doc(db, SHEETS_COLLECTION, sheetId);
    await updateDoc(docRef, {
      status: 'sent',
      updatedAt: Timestamp.now(),
      sentAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error sending product sheet:', error);
    throw new Error('Failed to send product sheet');
  }
};
