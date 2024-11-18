import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Question } from '../types/question';

export const getQuestionsByTags = async (tags: string[]): Promise<Question[]> => {
  const questionsRef = collection(db, 'questions');
  const q = query(questionsRef, where('tags', 'array-contains-any', tags));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Question[];
};

export const getSupplierAnswers = async (supplierId: string): Promise<Record<string, string> | null> => {
  const docRef = doc(db, 'supplierAnswers', supplierId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data().answers;
  }
  
  return null;
};
