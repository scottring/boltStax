import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { 
  QuestionnaireTemplate, 
  QuestionnaireSubmission,
  SubmissionStatus,
  DocumentSubmission
} from '../types/questionnaire';

const QUESTIONNAIRES_COLLECTION = 'questionnaires';
const SUBMISSIONS_COLLECTION = 'submissions';
const TEMPLATES_COLLECTION = 'questionnaireTemplates';

// Template Management
export const saveQuestionnaireTemplate = async (
  template: Omit<QuestionnaireTemplate, 'id'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), template);
    return docRef.id;
  } catch (error) {
    console.error('Error saving questionnaire template:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to save questionnaire template: ${error.message}`);
    }
    throw new Error('Failed to save questionnaire template');
  }
};

export const getQuestionnaireTemplates = async (): Promise<QuestionnaireTemplate[]> => {
  try {
    const q = query(collection(db, TEMPLATES_COLLECTION), orderBy('title'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QuestionnaireTemplate));
  } catch (error) {
    console.error('Error fetching questionnaire templates:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch questionnaire templates: ${error.message}`);
    }
    throw new Error('Failed to fetch questionnaire templates');
  }
};

// Questionnaire Request Management
export const createQuestionnaireRequest = async (
  supplierId: string,
  templateId: string,
  deadline?: Date
): Promise<string> => {
  try {
    // Get the template
    const templateDoc = await getDoc(doc(db, TEMPLATES_COLLECTION, templateId));
    if (!templateDoc.exists()) {
      throw new Error('Template not found');
    }

    const template = templateDoc.data() as Omit<QuestionnaireTemplate, 'id'>;

    // Create the questionnaire
    const questionnaireDoc = await addDoc(collection(db, QUESTIONNAIRES_COLLECTION), {
      ...template,
      templateId,
      supplierId,
      createdAt: Timestamp.fromDate(new Date()),
      deadline: deadline ? Timestamp.fromDate(deadline) : null,
      status: 'pending'
    });

    // Create initial submission draft
    await addDoc(collection(db, SUBMISSIONS_COLLECTION), {
      questionnaireId: questionnaireDoc.id,
      supplierId,
      status: 'draft',
      answers: {},
      documents: [],
      lastUpdated: Timestamp.fromDate(new Date()),
      completionRate: 0
    });

    // Update supplier's pending requests count
    const supplierRef = doc(db, 'suppliers', supplierId);
    await updateDoc(supplierRef, {
      pendingRequests: (await getDoc(supplierRef)).data()?.pendingRequests + 1 || 1,
      lastUpdated: Timestamp.fromDate(new Date())
    });

    return questionnaireDoc.id;
  } catch (error) {
    console.error('Error creating questionnaire request:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create questionnaire request: ${error.message}`);
    }
    throw new Error('Failed to create questionnaire request');
  }
};

// Submission Management
export const getQuestionnaireSubmission = async (
  questionnaireId: string,
  supplierId: string
): Promise<QuestionnaireSubmission | null> => {
  try {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where('questionnaireId', '==', questionnaireId),
      where('supplierId', '==', supplierId)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      submittedAt: data.submittedAt?.toDate(),
      lastUpdated: data.lastUpdated.toDate(),
      documents: data.documents.map((doc: any) => ({
        ...doc,
        uploadedAt: doc.uploadedAt.toDate()
      }))
    } as QuestionnaireSubmission;
  } catch (error) {
    console.error('Error fetching questionnaire submission:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch questionnaire submission: ${error.message}`);
    }
    throw new Error('Failed to fetch questionnaire submission');
  }
};

export const updateSubmissionStatus = async (
  submissionId: string,
  status: SubmissionStatus,
  comment?: string
): Promise<void> => {
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    const updateData: Record<string, any> = {
      status,
      lastUpdated: Timestamp.fromDate(new Date())
    };

    if (status === 'submitted') {
      updateData.submittedAt = Timestamp.fromDate(new Date());
    }

    if (comment) {
      updateData.statusComment = comment;
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating submission status:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to update submission status: ${error.message}`);
    }
    throw new Error('Failed to update submission status');
  }
};

export const addDocumentToSubmission = async (
  submissionId: string,
  document: Omit<DocumentSubmission, 'uploadedAt'>
): Promise<void> => {
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    const submission = await getDoc(docRef);
    const data = submission.data();
    
    if (!data) throw new Error('Submission not found');

    const documents = [...data.documents, {
      ...document,
      uploadedAt: Timestamp.fromDate(new Date())
    }];

    await updateDoc(docRef, {
      documents,
      lastUpdated: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error adding document to submission:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to add document to submission: ${error.message}`);
    }
    throw new Error('Failed to add document to submission');
  }
};

export const updateSubmissionAnswers = async (
  submissionId: string,
  answers: QuestionnaireSubmission['answers'],
  completionRate: number
): Promise<void> => {
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    await updateDoc(docRef, {
      answers,
      completionRate,
      lastUpdated: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error updating submission answers:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to update submission answers: ${error.message}`);
    }
    throw new Error('Failed to update submission answers');
  }
};
