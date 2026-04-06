import { defaultLocale, messages, type Locale } from "@/lib/i18n/messages";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "fr" || value === "en";
}

export function translate(
  locale: Locale,
  key: string,
  values?: Record<string, string | number>,
): string {
  const template: string =
    messages[locale][key as keyof (typeof messages)[typeof locale]] ??
    messages[defaultLocale][key as keyof (typeof messages)[typeof defaultLocale]] ??
    key;

  if (!values) {
    return template;
  }

  return Object.entries(values).reduce<string>(
    (result, [token, value]) => result.replaceAll(`{${token}}`, String(value)),
    template,
  );
}
