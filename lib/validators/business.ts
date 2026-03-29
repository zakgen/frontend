import { z } from "zod";

export const faqItemSchema = z.object({
  id: z.string(),
  question: z.string().min(1, "La question est obligatoire"),
  answer: z.string().min(1, "La reponse est obligatoire"),
});

export const businessProfileSchema = z.object({
  name: z.string().min(2, "Le nom de la boutique est obligatoire"),
  summary: z.string().min(10, "Ajoutez un resume utile pour l'assistant"),
  niche: z.string().min(2, "Le secteur est obligatoire"),
  city: z.string().min(2, "La ville est obligatoire"),
  supported_languages: z.array(z.string().min(1)).min(1, "Ajoutez au moins une langue"),
  tone_of_voice: z.enum(["formal", "friendly", "professional"], {
    errorMap: () => ({ message: "Choisissez un ton de voix" }),
  }),
  opening_hours: z.array(z.string().min(1)).min(1, "Ajoutez les horaires d'ouverture"),
  delivery_zones: z.array(z.string().min(1)).min(1, "Ajoutez au moins une zone de livraison"),
  delivery_time: z.string().min(2, "Le delai de livraison est obligatoire"),
  shipping_policy: z.string().min(8, "La politique de livraison est obligatoire"),
  return_policy: z.string().min(8, "La politique de retour est obligatoire"),
  payment_methods: z
    .array(z.enum(["cash_on_delivery", "card_payment", "bank_transfer"]))
    .min(1, "Ajoutez au moins un mode de paiement"),
  faq: z.array(faqItemSchema),
  order_rules: z.array(z.string().min(1)),
  escalation_contact: z.string().min(3, "Le contact de relais humain est obligatoire"),
  upsell_rules: z.array(z.string().min(1)),
});

export type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;
