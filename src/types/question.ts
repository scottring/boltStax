import { z } from 'zod';

export const QuestionTagSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tag name is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  description: z.string().optional()
});

export const QuestionSectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Section name is required"),
  description: z.string().optional(),
  order: z.number().int().min(0)
});

export const QuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["text", "yesNo", "multipleChoice", "scale"]),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
  sectionId: z.string().optional(),
  order: z.number().int().min(0).optional(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type QuestionTag = z.infer<typeof QuestionTagSchema>;
export type QuestionSection = z.infer<typeof QuestionSectionSchema>;
export type Question = z.infer<typeof QuestionSchema>;

export type QuestionType = "text" | "yesNo" | "multipleChoice" | "scale";
