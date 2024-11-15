import { z } from 'zod';

export const QuestionTypeSchema = z.enum([
  'text',
  'multiChoice',
  'checkbox',
  'file'
]);

export const QuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Question text is required"),
  type: QuestionTypeSchema,
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  tags: z.array(z.string())
});

export const RequiredDocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  description: z.string(),
  required: z.boolean()
});

export const QuestionnaireTemplateSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  tags: z.array(z.string()),
  questions: z.array(QuestionSchema),
  requiredDocuments: z.array(RequiredDocumentSchema)
});

export const SubmissionStatusSchema = z.enum([
  'draft',
  'submitted',
  'in_review',
  'needs_clarification',
  'approved'
]);

export const QuestionAnswerSchema = z.object({
  value: z.union([z.string(), z.array(z.string())]),
  flagged: z.boolean().optional(),
  comments: z.string().optional()
});

export const DocumentSubmissionSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  uploadedAt: z.date()
});

export const QuestionnaireSubmissionSchema = z.object({
  id: z.string(),
  questionnaireId: z.string(),
  supplierId: z.string(),
  status: SubmissionStatusSchema,
  answers: z.record(QuestionAnswerSchema),
  documents: z.array(DocumentSubmissionSchema),
  submittedAt: z.date().optional(),
  lastUpdated: z.date(),
  completionRate: z.number().min(0).max(100)
});

export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type RequiredDocument = z.infer<typeof RequiredDocumentSchema>;
export type QuestionnaireTemplate = z.infer<typeof QuestionnaireTemplateSchema>;
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;
export type QuestionAnswer = z.infer<typeof QuestionAnswerSchema>;
export type DocumentSubmission = z.infer<typeof DocumentSubmissionSchema>;
export type QuestionnaireSubmission = z.infer<typeof QuestionnaireSubmissionSchema>;
