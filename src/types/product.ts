import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Product name is required"),
  supplierId: z.string(),
  lastUpdated: z.date(),
  tags: z.array(z.string()),
  availableToCustomers: z.array(z.string()).default([]), // Customer IDs
  customerSettings: z.record(z.string()).default({})     // Customer-specific settings
});

export type Product = z.infer<typeof ProductSchema>;
