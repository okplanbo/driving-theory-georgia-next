'use client';

import { Language } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  className?: string;
}

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'ka', label: 'ქართული', flag: '🇬🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  className,
}: LanguageSelectorProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onLanguageChange(lang.code)}
          className={cn(
            'px-2 py-1 rounded-md text-sm transition-colors',
            currentLanguage === lang.code
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted text-muted-foreground'
          )}
          title={lang.label}
        >
          <span className="mr-1">{lang.flag}</span>
          <span className="hidden sm:inline">{lang.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}

// Compact version for mobile
export function LanguageSelectorCompact({
  currentLanguage,
  onLanguageChange,
  className,
}: LanguageSelectorProps) {
  return (
    <select
      value={currentLanguage}
      onChange={(e) => onLanguageChange(e.target.value as Language)}
      className={cn(
        'px-2 py-1 rounded-md text-sm border bg-background',
        className
      )}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.label}
        </option>
      ))}
    </select>
  );
}
