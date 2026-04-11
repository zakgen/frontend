import { z } from "zod";

export const faqItemSchema = z.object({
  id: z.string(),
  question: z.string().min(1, "La question est obligatoire"),
  answer: z.string().min(1, "La reponse est obligatoire"),
});

export const businessProfileSchema = z.object({
  name: z.string(),
  summary: z.string(),
  niche: z.string(),
  city: z.string(),
  default_language: z.enum(["arabic", "french"], {
    errorMap: () => ({ message: "Choisissez une langue par defaut" }),
  }),
  tone_of_voice: z.enum(["formal", "friendly", "professional"], {
    errorMap: () => ({ message: "Choisissez un ton de voix" }),
  }),
  opening_hours: z.array(z.string().min(1)),
  delivery_zones: z.array(z.string().min(1)),
  delivery_time: z.string(),
  shipping_policy: z.string(),
  return_policy: z.string(),
  payment_methods: z.array(
    z.enum(["cash_on_delivery", "card_payment", "bank_transfer"]),
  ),
  faq: z.array(faqItemSchema),
  order_rules: z.array(z.string().min(1)),
  escalation_contact: z.string(),
  upsell_rules: z.array(z.string().min(1)),
});

export type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;
