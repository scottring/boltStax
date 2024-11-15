import { Timestamp } from 'firebase/firestore';

// Base types for questions and tags
export interface QuestionTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export type QuestionType = 
  | 'shortText'      // Short text input
  | 'longText'       // Multi-line text input
  | 'singleChoice'   // Radio buttons
  | 'multiChoice'    // Checkboxes
  | 'number'         // Numeric input
  | 'date'           // Date picker
  | 'file'           // File upload
  | 'boolean';       // Yes/No

export interface QuestionOption {
  id: string;
  text: string;
  value: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  description?: string;
  options?: QuestionOption[];  // For singleChoice and multiChoice
  validation?: {
    min?: number;             // For number type
    max?: number;             // For number type
    pattern?: string;         // Regex pattern for text validation
    allowedFileTypes?: string[]; // For file type
  };
  tags: string[];            // Tag IDs
}

// Template structure
export interface QuestionnaireSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  order: number;
}

export interface QuestionnaireTemplate {
  id: string;
  title: string;           // Changed from 'name' to match existing code
  description: string;
  sections: QuestionnaireSection[];
  tags: string[];         // All tags used in this template
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;      // User ID
  isArchived: boolean;
  version: number;        // For tracking template versions
}

// Submission types (maintaining compatibility with existing code)
export type SubmissionStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending';

export interface DocumentSubmission {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Timestamp;
  uploadedBy: string;
}

export interface QuestionnaireSubmission {
  id: string;
  questionnaireId: string;
  supplierId: string;
  status: SubmissionStatus;
  answers: Record<string, any>;  // Question ID to answer mapping
  documents: DocumentSubmission[];
  completionRate: number;
  lastUpdated: Date;
  submittedAt?: Date;
  statusComment?: string;
}

// Response tracking
export interface QuestionResponse {
  questionId: string;
  value: string | string[] | number | boolean | null;
  fileUrls?: string[];
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface SectionResponse {
  sectionId: string;
  responses: QuestionResponse[];
  completedAt?: Timestamp;
}

export interface QuestionnaireResponse {
  id: string;
  templateId: string;
  productSheetId: string;
  supplierId: string;
  sections: SectionResponse[];
  status: SubmissionStatus;
  startedAt: Timestamp;
  lastUpdated: Timestamp;
  submittedAt?: Timestamp;
  submittedBy?: string;
  completionRate: number;
  documents: DocumentSubmission[];
}

// Autosave drafts
export interface ResponseDraft {
  id: string;
  responseId: string;
  questionId: string;
  value: string | string[] | number | boolean | null;
  fileUrls?: string[];
  savedAt: Timestamp;
}

// Template versioning
export interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  changes: string[];
  sections: QuestionnaireSection[];
  updatedAt: Timestamp;
  updatedBy: string;
}

// Usage tracking
export interface TemplateUsage {
  templateId: string;
  productSheetId: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  status: 'active' | 'completed' | 'archived';
}
