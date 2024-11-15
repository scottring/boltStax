import { collection, addDoc, getDocs, query, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Question, QuestionTag } from '../types/question';

const QUESTIONS_COLLECTION = 'questions';
const TAGS_COLLECTION = 'questionTags';

export const addQuestion = async (question: Omit<Question, 'id'>): Promise<void> => {
  try {
    const questionData = {
      ...question,
      createdAt: Timestamp.fromDate(question.createdAt),
      updatedAt: Timestamp.fromDate(question.updatedAt)
    };
    await addDoc(collection(db, QUESTIONS_COLLECTION), questionData);
  } catch (error) {
    console.error('Error adding question:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to add question');
  }
};

export const updateQuestion = async (question: Question): Promise<void> => {
  try {
    const questionRef = doc(db, QUESTIONS_COLLECTION, question.id);
    const questionData = {
      ...question,
      updatedAt: Timestamp.fromDate(new Date())
    };
    await updateDoc(questionRef, questionData);
  } catch (error) {
    console.error('Error updating question:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update question');
  }
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
  try {
    const questionRef = doc(db, QUESTIONS_COLLECTION, questionId);
    await deleteDoc(questionRef);
  } catch (error) {
    console.error('Error deleting question:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete question');
  }
};

export const addTag = async (tag: QuestionTag): Promise<void> => {
  try {
    await addDoc(collection(db, TAGS_COLLECTION), tag);
  } catch (error) {
    console.error('Error adding tag:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to add tag');
  }
};

export const updateTag = async (tag: QuestionTag): Promise<void> => {
  try {
    const tagRef = doc(db, TAGS_COLLECTION, tag.id);
    await updateDoc(tagRef, tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update tag');
  }
};

export const deleteTag = async (tagId: string): Promise<void> => {
  try {
    const tagRef = doc(db, TAGS_COLLECTION, tagId);
    await deleteDoc(tagRef);
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete tag');
  }
};

export const getTags = async (): Promise<QuestionTag[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, TAGS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QuestionTag));
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch tags');
  }
};

export const getQuestions = async (): Promise<Question[]> => {
  try {
    const q = query(collection(db, QUESTIONS_COLLECTION), orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as Question));
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch questions');
  }
};

export const initializeSupplierQuestions = async (): Promise<void> => {
  try {
    const snapshot = await getDocs(collection(db, QUESTIONS_COLLECTION));
    if (!snapshot.empty) return;

    // Add initial questions if needed
    const initialQuestion = {
      text: 'What is your company name?',
      type: 'text' as const,
      required: true,
      tags: [],
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addQuestion(initialQuestion);
  } catch (error) {
    console.error('Error initializing questions:', error);
    throw error;
  }
};