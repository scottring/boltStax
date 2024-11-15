import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Product } from '../types/product';

const PRODUCTS_COLLECTION = 'products';

export const addProduct = async (product: Product): Promise<void> => {
  try {
    const productData = {
      ...product,
      lastUpdated: Timestamp.fromDate(product.lastUpdated)
    };
    await addDoc(collection(db, PRODUCTS_COLLECTION), productData);
  } catch (error) {
    console.error('Error adding product:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to add product');
  }
};

export const getSupplierProducts = async (supplierId: string): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('supplierId', '==', supplierId),
      orderBy('lastUpdated', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
    } as Product));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch products');
  }
};