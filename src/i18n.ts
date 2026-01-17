import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import adminTh from './locales/admin/th.json';
import adminEn from './locales/admin/en.json';
import commonTh from './locales/common/th.json';
import commonEn from './locales/common/en.json';
import homeTh from './locales/home/th.json';
import homeEn from './locales/home/en.json';

const resources = {
  th: {
    admin: adminTh,
    common: commonTh,
    home: homeTh,
  },
  en: {
    admin: adminEn,
    common: commonEn,
    home: homeEn,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'th',
    ns: ['admin', 'common', 'home'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
