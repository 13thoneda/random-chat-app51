import * as React from "react";

export type Language = 'en' | 'hi' | 'bn' | 'te' | 'mr' | 'ta' | 'gu' | 'ur' | 'kn' | 'ml' | 'pa' | 'es' | 'fr' | 'de' | 'pt' | 'ar' | 'zh';

export const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = React.createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

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

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = React.useState<Language>('en');

  // Load saved language on mount
  React.useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('ajnabicam_language') as Language;
      if (savedLanguage && translations[savedLanguage]) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.warn('Error loading saved language:', error);
    }
  }, []);

  const setLanguage = React.useCallback((lang: Language) => {
    try {
      setLanguageState(lang);
      localStorage.setItem('ajnabicam_language', lang);
    } catch (error) {
      console.warn('Error saving language:', error);
    }
  }, []);

  const t = React.useCallback((key: string): string => {
    try {
      const translation = translations[language]?.[key] || translations['en']?.[key];
      return translation || key;
    } catch (error) {
      console.warn('Error translating key:', key, error);
      return key;
    }
  }, [language]);

  const value = React.useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
