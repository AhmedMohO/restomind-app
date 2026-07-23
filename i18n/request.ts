import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { setZodLocale } from '@/lib/zod-locale';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "en" | "ar")) {
    locale = routing.defaultLocale;
  }

  setZodLocale(locale);

  const baseMessages = await import(`../messages/${locale}.json`);
  const dashboardMessages = await import(`../messages/dashboard/${locale}.json`);

  return {
    locale,
    messages: {
      ...baseMessages.default,
      Dashboard: { ...dashboardMessages.default },
    },
  };
});

