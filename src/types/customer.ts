import { z } from 'zod';

export const CustomerInvitationStatus = z.enum([
  "pending_invitation",
  "invitation_sent",
  "registered",
  "active",
  "inactive"
]);

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Customer name is required"),
  taskProgress: z.number().min(0).max(100),
  primaryContact: z.string().email("Invalid email address"),
  status: CustomerInvitationStatus,
  lastUpdated: z.date(),
  contactName: z.string().min(1, "Contact name is required"),
  invitationSentDate: z.date().optional(),
  registrationDate: z.date().optional(),
  lastLoginDate: z.date().optional(),
  pendingRequests: z.number().default(0),
  completedRequests: z.number().default(0),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  purchasedProducts: z.array(z.string()).default([])  // Array of product IDs
});

export const CustomerInviteSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  primaryContact: z.string().email("Invalid email address"),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export type Customer = z.infer<typeof CustomerSchema>;
export type CustomerInvite = z.infer<typeof CustomerInviteSchema>;
