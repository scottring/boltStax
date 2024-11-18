import { collection, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Tag } from '../types/tag';
import { ensureTagColor } from '../types/tag';

const TAGS_COLLECTION = 'questionTags';

export const getTags = async (): Promise<Tag[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, TAGS_COLLECTION));
    return querySnapshot.docs.map(doc => ensureTagColor({
      id: doc.id,
      ...doc.data()
    } as Tag));
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch tags');
  }
};

export const createTag = async (tag: Omit<Tag, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, TAGS_COLLECTION), tag);
    return docRef.id;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create tag');
  }
};

export const getTagById = async (tagId: string): Promise<Tag | null> => {
  try {
    const docRef = doc(db, TAGS_COLLECTION, tagId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    return ensureTagColor({
      id: docSnap.id,
      ...docSnap.data()
    } as Tag);
  } catch (error) {
    console.error('Error fetching tag:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch tag');
  }
};

export const resolveTagIds = async (tagIds: string[]): Promise<Tag[]> => {
  try {
    const tagPromises = tagIds.map(id => getTagById(id));
    const tags = await Promise.all(tagPromises);
    return tags.filter((tag): tag is Tag => tag !== null);
  } catch (error) {
    console.error('Error resolving tags:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to resolve tags');
  }
};
