import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translations from './locales/translations';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translations.en },
      id: { translation: translations.id }
    },
    lng: localStorage.getItem('language') || 'id', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
