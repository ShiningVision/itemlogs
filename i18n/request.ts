// i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { getSettings } from '@/app/lib/services/settings';
import { supabase } from '@/app/lib/db/client';

const DEFAULT_LOCALE = 'en';

export default getRequestConfig(async () => {
  let locale = DEFAULT_LOCALE;

  try {
    const settings = await getSettings();
    const { data: language } = await supabase
      .from('languages')
      .select('code')
      .eq('id', settings.language)
      .single();

    if (language?.code) locale = language.code;
  } catch {
    // Fall back to default if settings/language lookup fails
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});