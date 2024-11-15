import { z } from 'zod';

export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Supplier name is required"),
  taskProgress: z.number().min(0).max(100),
  primaryContact: z.string().email("Invalid email address"),
  status: z.enum(["active", "pending", "inactive"]),
  complianceScore: z.number().min(0).max(100).optional(),
  lastUpdated: z.date()
});

export type Supplier = z.infer<typeof SupplierSchema>;