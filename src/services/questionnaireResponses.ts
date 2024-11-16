import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  addDoc, 
  Timestamp,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { 
  QuestionnaireResponse, 
  ResponseDraft, 
  QuestionResponse,
  SectionResponse
} from '../types/questionnaire';
import { sendNotification } from './notifications';
import type { QuestionnaireNotification } from './notifications';

const RESPONSES_COLLECTION = 'questionnaireResponses';
const DRAFTS_COLLECTION = 'responseDrafts';

// Auto-save debounce timeout (2 seconds)
const AUTOSAVE_DEBOUNCE = 2000;

let autoSaveTimeout: NodeJS.Timeout;

export const getQuestionnaireResponse = async (
  productSheetId: string,
  supplierId: string
): Promise<QuestionnaireResponse | null> => {
  try {
    const q = query(
      collection(db, RESPONSES_COLLECTION),
      where('productSheetId', '==', productSheetId),
      where('supplierId', '==', supplierId)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as QuestionnaireResponse;
  } catch (error) {
    console.error('Error fetching questionnaire response:', error);
    throw error;
  }
};

export const createQuestionnaireResponse = async (
  templateId: string,
  productSheetId: string,
  supplierId: string,
  sections: SectionResponse[],
  userId: string
): Promise<string> => {
  try {
    const response: Omit<QuestionnaireResponse, 'id'> = {
      templateId,
      productSheetId,
      supplierId,
      sections,
      status: 'pending',
      startedAt: Timestamp.now(),
      lastUpdated: Timestamp.now(),
      completionRate: 0,
      documents: []
    };

    const docRef = await addDoc(collection(db, RESPONSES_COLLECTION), response);
    return docRef.id;
  } catch (error) {
    console.error('Error creating questionnaire response:', error);
    throw error;
  }
};

export const updateQuestionResponse = async (
  responseId: string,
  sectionId: string,
  questionId: string,
  value: QuestionResponse['value'],
  userId: string,
  fileUrls?: string[]
) => {
  // Clear any pending auto-save
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  // Schedule new auto-save
  autoSaveTimeout = setTimeout(async () => {
    try {
      // Save draft first
      const draft: Omit<ResponseDraft, 'id'> = {
        responseId,
        questionId,
        value,
        fileUrls,
        savedAt: Timestamp.now()
      };
      await addDoc(collection(db, DRAFTS_COLLECTION), draft);

      // Update the main response
      const responseRef = doc(db, RESPONSES_COLLECTION, responseId);
      const response = await getDoc(responseRef);
      if (!response.exists()) throw new Error('Response not found');

      const responseData = response.data() as QuestionnaireResponse;
      const updatedSections = responseData.sections.map(section => {
        if (section.sectionId !== sectionId) return section;

        const updatedResponses = section.responses.map(response => {
          if (response.questionId !== questionId) return response;
          return {
            ...response,
            value,
            fileUrls,
            updatedAt: Timestamp.now(),
            updatedBy: userId
          };
        });

        if (!updatedResponses.some(r => r.questionId === questionId)) {
          updatedResponses.push({
            questionId,
            value,
            fileUrls,
            updatedAt: Timestamp.now(),
            updatedBy: userId
          });
        }

        return {
          ...section,
          responses: updatedResponses
        };
      });

      // Calculate completion rate
      const totalQuestions = responseData.sections.reduce(
        (total, section) => total + section.responses.length,
        0
      );
      const answeredQuestions = responseData.sections.reduce(
        (total, section) => total + section.responses.filter(r => r.value !== null).length,
        0
      );
      const completionRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

      await updateDoc(responseRef, {
        sections: updatedSections,
        lastUpdated: Timestamp.now(),
        completionRate
      });
    } catch (error) {
      console.error('Error auto-saving response:', error);
      throw error;
    }
  }, AUTOSAVE_DEBOUNCE);
};

export const submitQuestionnaireResponse = async (
  responseId: string,
  userId: string
) => {
  try {
    const responseRef = doc(db, RESPONSES_COLLECTION, responseId);
    const response = await getDoc(responseRef);
    if (!response.exists()) throw new Error('Response not found');

    await updateDoc(responseRef, {
      status: 'completed',
      submittedAt: Timestamp.now(),
      submittedBy: userId,
      lastUpdated: Timestamp.now()
    });

    // Send notification to the requesting company
    const responseData = response.data() as QuestionnaireResponse;
    const notification: Omit<QuestionnaireNotification, 'id' | 'read'> = {
      type: 'questionnaireSubmitted',
      productSheetId: responseData.productSheetId,
      supplierId: responseData.supplierId,
      timestamp: Timestamp.now()
    };
    await sendNotification(notification);

  } catch (error) {
    console.error('Error submitting questionnaire response:', error);
    throw error;
  }
};

export const subscribeToResponseDrafts = (
  responseId: string,
  callback: (drafts: ResponseDraft[]) => void
) => {
  const q = query(
    collection(db, DRAFTS_COLLECTION),
    where('responseId', '==', responseId),
    orderBy('savedAt', 'desc'),
    limit(1)
  );

  return onSnapshot(q, (snapshot) => {
    const drafts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ResponseDraft));
    callback(drafts);
  });
};
