import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { setZodLocale } from '@/lib/zod-locale';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "en" | "ar")) {
    locale = routing.defaultLocale;
  }

  setZodLocale(locale);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});

