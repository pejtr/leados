import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import cs from "./cs.json";
import de from "./de.json";
import en from "./en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      cs: { translation: cs },
      de: { translation: de },
    },
    fallbackLng: "cs",
    supportedLngs: ["en", "cs", "de"],
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
  { code: "de", label: "DE", fullLabel: "Deutsch", flag: "🇩🇪" },
] as const;

export type LangCode = "en" | "cs" | "de";
