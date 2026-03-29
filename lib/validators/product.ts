import { z } from "zod";

export const productVariantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Le nom de la variante est obligatoire"),
  additional_price: z.coerce.number().min(0, "Le supplement doit etre positif").nullable(),
  stock_status: z.enum(["in_stock", "low_stock", "out_of_stock"]),
});

export const productSchema = z.object({
  name: z.string().min(2, "Le nom du produit est obligatoire"),
  description: z.string().min(6, "La description est obligatoire"),
  category: z.string().min(2, "La categorie est obligatoire"),
  price: z.coerce.number().min(0, "Le prix ne peut pas etre negatif").nullable(),
  currency: z.string().min(3).max(10),
  stock_status: z.enum(["in_stock", "low_stock", "out_of_stock"]),
  variants: z.array(productVariantSchema).max(10, "Maximum 10 variantes pour le V0"),
});

export const bulkImportSchema = z.object({
  payload: z.string().min(2, "Collez un JSON ou CSV pour continuer"),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type BulkImportFormValues = z.infer<typeof bulkImportSchema>;
