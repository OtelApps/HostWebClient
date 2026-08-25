import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import cs from '../locales/cs/common.json';
import de from '../locales/de/common.json';
import en from '../locales/en/common.json';

const LANGUAGE_KEY = 'otelapps_language';

const resources = {
  cs: { common: cs },
  en: { common: en },
  de: { common: de },
};

function detectLanguage(): string {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored && stored in resources) return stored;
  const nav = navigator.language.slice(0, 2);
  if (nav in resources) return nav;
  return 'cs';
}

void i18n.use(initReactI18next).init({
  lng: detectLanguage(),
  fallbackLng: 'cs',
  resources,
  interpolation: { escapeValue: false },
  defaultNS: 'common',
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANGUAGE_KEY, lng);
  document.documentElement.lang = lng;
});

document.documentElement.lang = i18n.language;

export default i18n;
