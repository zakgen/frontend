import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Entrez une adresse email valide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caracteres."),
});

export const signupSchema = loginSchema
  .extend({
    storeName: z.string().trim().min(2, "Ajoutez le nom de votre boutique."),
    confirmPassword: z.string().min(6, "Confirmez votre mot de passe."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Entrez une adresse email valide."),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirmez votre mot de passe."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
