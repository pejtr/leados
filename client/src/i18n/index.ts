import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import cs from "./cs.json";
import en from "./en.json";
import sk from "./sk.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      cs: { translation: cs },
      sk: { translation: sk },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "cs", "sk"],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "leadgen-language",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "EN", fullLabel: "English", flag: "🇬🇧" },
  { code: "cs", label: "CS", fullLabel: "Čeština", flag: "🇨🇿" },
  { code: "sk", label: "SK", fullLabel: "Slovenčina", flag: "🇸🇰" },
] as const;

export type LangCode = "en" | "cs" | "sk";
