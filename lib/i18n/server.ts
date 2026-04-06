import { cookies } from "next/headers";

import {
  defaultLocale,
  localeCookieName,
  type Locale,
} from "@/lib/i18n/messages";
import { isLocale, translate } from "@/lib/i18n/translator";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(localeCookieName)?.value;
  return isLocale(locale) ? locale : defaultLocale;
}

export async function getServerTranslator() {
  const locale = await getServerLocale();
  return {
    locale,
    t: (key: string, values?: Record<string, string | number>) =>
      translate(locale, key, values),
  };
}
