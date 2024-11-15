import { collection, addDoc, getDocs, query, orderBy, Timestamp, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { sendEmail } from './email';
import type { ProductSheet } from '../types/productSheet';
import type { Supplier } from '../types/supplier';

const SHEETS_COLLECTION = 'productSheets';

function generateAccessToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const createProductSheet = async (
  name: string,
  supplierId: string,
  selectedTags: string[],
  dueDate?: Date
): Promise<ProductSheet> => {
  try {
    const sheet: Omit<ProductSheet, 'id'> = {
      name,
      supplierId,
      selectedTags,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate,
      accessToken: generateAccessToken(),
      responses: {},
    };

    const docRef = await addDoc(collection(db, SHEETS_COLLECTION), {
      ...sheet,
      createdAt: Timestamp.fromDate(sheet.createdAt),
      updatedAt: Timestamp.fromDate(sheet.updatedAt),
      dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
    });

    return {
      ...sheet,
      id: docRef.id,
    };
  } catch (error) {
    console.error('Error creating product sheet:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create product sheet');
  }
};

export const getAllSheets = async (): Promise<ProductSheet[]> => {
  try {
    const q = query(collection(db, SHEETS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      dueDate: doc.data().dueDate?.toDate(),
      submittedAt: doc.data().submittedAt?.toDate(),
    } as ProductSheet));
  } catch (error) {
    console.error('Error fetching sheets:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch sheets');
  }
};

export const getSheet = async (sheetId: string): Promise<ProductSheet> => {
  try {
    const docRef = doc(db, SHEETS_COLLECTION, sheetId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Sheet not found');
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      dueDate: docSnap.data().dueDate?.toDate(),
      submittedAt: docSnap.data().submittedAt?.toDate(),
    } as ProductSheet;
  } catch (error) {
    console.error('Error fetching sheet:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch sheet');
  }
};

export const updateSheet = async (sheetId: string, updates: Partial<ProductSheet>): Promise<void> => {
  try {
    const docRef = doc(db, SHEETS_COLLECTION, sheetId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error updating sheet:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update sheet');
  }
};

export const deleteSheet = async (sheetId: string): Promise<void> => {
  try {
    const docRef = doc(db, SHEETS_COLLECTION, sheetId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting sheet:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete sheet');
  }
};

export const sendSheet = async (sheetId: string): Promise<void> => {
  try {
    const sheet = await getSheet(sheetId);
    const supplierRef = doc(db, 'suppliers', sheet.supplierId);
    const supplierSnap = await getDoc(supplierRef);
    
    if (!supplierSnap.exists()) {
      throw new Error('Supplier not found');
    }

    const supplier = supplierSnap.data() as Supplier;
    const accessUrl = `${window.location.origin}/sheets/${sheet.id}?token=${sheet.accessToken}`;

    await sendEmail({
      to: supplier.primaryContact,
      template: 'SHEET_CREATED',
      data: {
        sheetName: sheet.name,
        supplierName: supplier.name,
        dueDate: sheet.dueDate?.toLocaleDateString(),
        accessUrl,
      },
    });

    await updateSheet(sheetId, { status: 'sent' });
  } catch (error) {
    console.error('Error sending sheet:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to send sheet');
  }
};
