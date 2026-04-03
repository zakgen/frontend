import { z } from "zod";

export const testOrderItemSchema = z.object({
  product_name: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  variant: z.string().min(1).nullable().optional(),
});

export const testOrderConfirmationSchema = z.object({
  customer_phone: z.string().trim().min(6, "Le numero client est obligatoire."),
  customer_name: z.string().trim().min(2, "Le nom client est obligatoire."),
  preferred_language: z.enum(["french", "darija", "english"]),
  delivery_city: z.string().trim().min(2, "La ville de livraison est obligatoire."),
  delivery_address: z.string().trim().min(5, "L'adresse de livraison est obligatoire."),
  total_amount: z.coerce.number().gt(0, "Le montant total doit etre superieur a 0."),
  items: z.array(testOrderItemSchema).min(1, "Ajoutez au moins un article."),
});

export type TestOrderConfirmationFormValues = z.infer<
  typeof testOrderConfirmationSchema
>;
