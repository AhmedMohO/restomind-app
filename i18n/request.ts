import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { setZodLocale } from '@/lib/zod-locale';
import { headers } from 'next/headers';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "en" | "ar")) {
    locale = routing.defaultLocale;
  }

  setZodLocale(locale);

  const baseMessages = await import(`../messages/${locale}.json`);

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? headersList.get('next-url') ?? '';
  const isDashboard =
    pathname === `/${locale}/dashboard` ||
    pathname.startsWith(`/${locale}/dashboard/`);

  const dashboardMessages = isDashboard
    ? (await import(`../messages/dashboard/${locale}.json`)).default
    : {};

  return {
    locale,
    messages: {
      ...baseMessages.default,
      ...(isDashboard ? { Dashboard: dashboardMessages } : {}),
    },
  };
});

