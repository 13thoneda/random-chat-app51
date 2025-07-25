import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = 'en' | 'hi' | 'bn' | 'te' | 'mr' | 'ta' | 'gu' | 'ur' | 'kn' | 'ml' | 'pa' | 'es' | 'fr' | 'de' | 'pt' | 'ar' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

// Simplified translations for now
const translations: Record<Language, Record<string, string>> = {
  'en': {
    'app.name': 'AjnabiCam',
    'nav.home': 'Home',
    'nav.chat': 'Chat',
    'nav.friends': 'Friends',
    'nav.voice': 'Voice',
    'nav.profile': 'Profile',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
  },
  'hi': {
    'app.name': 'अजनबीकैम',
    'nav.home': 'होम',
    'nav.chat': 'चैट',
    'nav.friends': 'दोस्त',
    'nav.voice': 'आवाज़',
    'nav.profile': 'प्रोफ़ाइल',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.cancel': 'रद्द करें',
    'common.save': 'सेव करें',
  },
  'bn': { 'app.name': 'AjnabiCam' },
  'te': { 'app.name': 'AjnabiCam' },
  'mr': { 'app.name': 'AjnabiCam' },
  'ta': { 'app.name': 'AjnabiCam' },
  'gu': { 'app.name': 'AjnabiCam' },
  'ur': { 'app.name': 'AjnabiCam' },
  'kn': { 'app.name': 'AjnabiCam' },
  'ml': { 'app.name': 'AjnabiCam' },
  'pa': { 'app.name': 'AjnabiCam' },
  'es': { 'app.name': 'AjnabiCam' },
  'fr': { 'app.name': 'AjnabiCam' },
  'de': { 'app.name': 'AjnabiCam' },
  'pt': { 'app.name': 'AjnabiCam' },
  'ar': { 'app.name': 'AjnabiCam' },
  'zh': { 'app.name': 'AjnabiCam' },
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load saved language on mount
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('ajnabicam_language') as Language;
      if (savedLanguage && translations[savedLanguage]) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.warn('Error loading saved language:', error);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    try {
      setLanguageState(lang);
      localStorage.setItem('ajnabicam_language', lang);
    } catch (error) {
      console.warn('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    try {
      const translation = translations[language]?.[key] || translations['en']?.[key];
      return translation || key;
    } catch (error) {
      console.warn('Error translating key:', key, error);
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
