import { z } from 'zod';

export const ComplianceRecordSchema = z.object({
  date: z.date(),
  score: z.number().min(0).max(100),
  category: z.string()
});

export const SupplierInvitationStatus = z.enum([
  "pending_invitation",
  "invitation_sent",
  "registered",
  "active",
  "inactive"
]);

export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Supplier name is required"),
  taskProgress: z.number().min(0).max(100),
  primaryContact: z.string().email("Invalid email address"),
  status: SupplierInvitationStatus,
  complianceScore: z.number().min(0).max(100).optional(),
  lastUpdated: z.date(),
  contactName: z.string().min(1, "Contact name is required"),
  invitationSentDate: z.date().optional(),
  registrationDate: z.date().optional(),
  lastLoginDate: z.date().optional(),
  pendingRequests: z.number().default(0),
  completedRequests: z.number().default(0),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  complianceHistory: z.array(ComplianceRecordSchema).default([])
});

export const SupplierInviteSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  primaryContact: z.string().email("Invalid email address"),
  notes: z.string().optional()
});

export type ComplianceRecord = z.infer<typeof ComplianceRecordSchema>;
export type Supplier = z.infer<typeof SupplierSchema>;
export type SupplierInvite = z.infer<typeof SupplierInviteSchema>;
