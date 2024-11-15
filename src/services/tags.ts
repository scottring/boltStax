import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Tag } from '../types/tag';

const TAGS_COLLECTION = 'tags';

export const getTags = async (): Promise<Tag[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, TAGS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Tag));
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch tags');
  }
};