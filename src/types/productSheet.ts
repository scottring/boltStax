import { z } from 'zod';

export const ProductSheetSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Sheet name is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  selectedTags: z.array(z.string()).min(1, "At least one tag is required"),
  status: z.enum(["draft", "sent", "inProgress", "completed"]),
  createdAt: z.date(),
  updatedAt: z.date(),
  dueDate: z.date().optional(),
  submittedAt: z.date().optional(),
  accessToken: z.string(),
  responses: z.record(z.string(), z.any()).optional(),
});

export type ProductSheet = z.infer<typeof ProductSheetSchema>;