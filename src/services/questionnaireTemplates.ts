import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  updateDoc,
  query, 
  where, 
  orderBy, 
  Timestamp,
  doc,
  writeBatch,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { 
  QuestionnaireTemplate, 
  QuestionnaireSection,
  TemplateVersion,
  Question
} from '../types/questionnaire';

const TEMPLATES_COLLECTION = 'questionnaireTemplates';
const VERSIONS_COLLECTION = 'templateVersions';
const SECTIONS_COLLECTION = 'questionnaireSections';
const QUESTIONS_COLLECTION = 'questionnaireQuestions';

// Template Management
export const createTemplate = async (
  template: Omit<QuestionnaireTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<string> => {
  try {
    const batch = writeBatch(db);

    // Create the template
    const templateDoc = await addDoc(collection(db, TEMPLATES_COLLECTION), {
      ...template,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      version: 1,
      isArchived: false
    });

    // Create sections with their questions
    for (const section of template.sections) {
      const sectionDoc = await addDoc(collection(db, SECTIONS_COLLECTION), {
        ...section,
        templateId: templateDoc.id,
        questions: [] // We'll store questions separately
      });

      // Create questions for this section
      for (const question of section.questions) {
        await addDoc(collection(db, QUESTIONS_COLLECTION), {
          ...question,
          templateId: templateDoc.id,
          sectionId: sectionDoc.id
        });
      }
    }

    await batch.commit();
    return templateDoc.id;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

export const updateTemplate = async (
  templateId: string,
  updates: Partial<QuestionnaireTemplate>,
  changeDescription: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const templateRef = doc(db, TEMPLATES_COLLECTION, templateId);
    const template = await getDoc(templateRef);
    
    if (!template.exists()) {
      throw new Error('Template not found');
    }

    const currentVersion = template.data().version;

    // Create a new version record
    await addDoc(collection(db, VERSIONS_COLLECTION), {
      templateId,
      version: currentVersion,
      changes: [changeDescription],
      sections: updates.sections || template.data().sections,
      updatedAt: Timestamp.now(),
      updatedBy: updates.createdBy
    } as TemplateVersion);

    // Update the template
    batch.update(templateRef, {
      ...updates,
      version: currentVersion + 1,
      updatedAt: Timestamp.now()
    });

    await batch.commit();
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

export const getTemplates = async (
  includeArchived: boolean = false
): Promise<QuestionnaireTemplate[]> => {
  try {
    const conditions = includeArchived ? [] : [where('isArchived', '==', false)];
    const q = query(
      collection(db, TEMPLATES_COLLECTION),
      ...conditions,
      orderBy('title')
    );

    const templates = await getDocs(q);
    const templatesWithSections: QuestionnaireTemplate[] = [];

    for (const templateDoc of templates.docs) {
      const template = templateDoc.data();
      
      // Get sections for this template
      const sectionsQuery = query(
        collection(db, SECTIONS_COLLECTION),
        where('templateId', '==', templateDoc.id),
        orderBy('order')
      );
      const sections = await getDocs(sectionsQuery);
      
      // Get questions for each section
      const sectionsWithQuestions: QuestionnaireSection[] = [];
      for (const sectionDoc of sections.docs) {
        const section = sectionDoc.data();
        
        const questionsQuery = query(
          collection(db, QUESTIONS_COLLECTION),
          where('sectionId', '==', sectionDoc.id)
        );
        const questions = await getDocs(questionsQuery);
        
        sectionsWithQuestions.push({
          ...section,
          id: sectionDoc.id,
          title: section.title,
          order: section.order,
          questions: questions.docs.map(q => ({ ...q.data(), id: q.id } as Question))
        } as QuestionnaireSection);
      }

      templatesWithSections.push({
        ...template,
        id: templateDoc.id,
        sections: sectionsWithQuestions
      } as QuestionnaireTemplate);
    }

    return templatesWithSections;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

export const getTemplatesByTags = async (
  tags: string[],
  includeArchived: boolean = false
): Promise<QuestionnaireTemplate[]> => {
  try {
    const conditions = [
      where('tags', 'array-contains-any', tags),
      ...(includeArchived ? [] : [where('isArchived', '==', false)])
    ];
    
    const q = query(
      collection(db, TEMPLATES_COLLECTION),
      ...conditions,
      orderBy('title')
    );

    const templates = await getDocs(q);
    return templates.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as QuestionnaireTemplate));
  } catch (error) {
    console.error('Error fetching templates by tags:', error);
    throw error;
  }
};

export const archiveTemplate = async (templateId: string): Promise<void> => {
  try {
    const templateRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await updateDoc(templateRef, {
      isArchived: true,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error archiving template:', error);
    throw error;
  }
};

export const getTemplateVersion = async (
  templateId: string,
  version: number
): Promise<TemplateVersion | null> => {
  try {
    const q = query(
      collection(db, VERSIONS_COLLECTION),
      where('templateId', '==', templateId),
      where('version', '==', version)
    );
    
    const versions = await getDocs(q);
    if (versions.empty) return null;

    return {
      ...versions.docs[0].data(),
      id: versions.docs[0].id
    } as TemplateVersion;
  } catch (error) {
    console.error('Error fetching template version:', error);
    throw error;
  }
};

export const addQuestionToSection = async (
  templateId: string,
  sectionId: string,
  question: Omit<Question, 'id'>
): Promise<string> => {
  try {
    const questionDoc = await addDoc(collection(db, QUESTIONS_COLLECTION), {
      ...question,
      templateId,
      sectionId
    });

    // Update template version and timestamp
    const templateRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await updateDoc(templateRef, {
      updatedAt: Timestamp.now(),
      version: arrayUnion(questionDoc.id)
    });

    return questionDoc.id;
  } catch (error) {
    console.error('Error adding question to section:', error);
    throw error;
  }
};
