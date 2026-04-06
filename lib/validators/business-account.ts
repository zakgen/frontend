import { z } from "zod";

export const createBusinessSchema = z.object({
  name: z.string().trim().min(1, "Le nom de la boutique est requis."),
  description: z.string().trim().optional(),
  city: z.string().trim().optional(),
  shipping_policy: z.string().trim().optional(),
});

export type CreateBusinessFormValues = z.infer<typeof createBusinessSchema>;
