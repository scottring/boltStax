import { z } from 'zod';

export const TagSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tag name is required"),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  description: z.string().optional(),
});

export type Tag = z.infer<typeof TagSchema>;

// Helper function to ensure a tag has a color
export const ensureTagColor = (tag: Tag): Tag => ({
  ...tag,
  color: tag.color || '#2E7D32' // Default to a green color if none provided
});
