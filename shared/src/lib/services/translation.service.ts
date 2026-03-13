import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { LocalizedString } from '../interfaces/localized-string.interface';
import {
  getFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from '../utils/storage.util';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from '../constants/language.constant';
import { SupportedLanguage } from '../types/language.type';

/**
 * Type guard for SupportedLanguage
 */
function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return (
    typeof value === 'string' &&
    SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
  );
}

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly currentLang = signal<SupportedLanguage>(
    this.getStoredLanguage()
  );
  private readonly translations = signal<Record<string, unknown>>({});

  constructor() {
    this.loadTranslations(this.currentLang());
  }

  /**
   * Get stored language from localStorage, with validation
   */
  private getStoredLanguage(): SupportedLanguage {
    return getFromStorage<SupportedLanguage>(STORAGE_KEYS.LANGUAGE, {
      defaultValue: DEFAULT_LANGUAGE,
      validator: isSupportedLanguage,
    });
  }

  /**
   * Save language to localStorage
   */
  private saveLanguage(lang: SupportedLanguage): void {
    saveToStorage(STORAGE_KEYS.LANGUAGE, lang);
  }

  setLanguage(lang: string): void {
    // Validate language
    if (!isSupportedLanguage(lang)) {
      lang = DEFAULT_LANGUAGE;
    }

    const validLang = lang as SupportedLanguage;
    this.currentLang.set(validLang);
    this.saveLanguage(validLang);
    this.loadTranslations(validLang);
  }

  getLanguage(): SupportedLanguage {
    return this.currentLang();
  }

  private loadTranslations(lang: string): void {
    const translationUrl = new URL(
      `assets/i18n/${lang}.json`,
      this.document.baseURI
    ).toString();

    this.http
      .get<Record<string, unknown>>(translationUrl)
      .pipe(
        catchError((err) => {
          console.error(
            `Could not load translations for ${lang} from ${translationUrl}`,
            err
          );
          return of({});
        })
      )
      .subscribe((data) => {
        this.translations.set(data);
      });
  }

  translate(key: string): string {
    const keys = key.split('.');
    let value: unknown = this.translations();

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key; // Return key if not found
      }
    }

    return typeof value === 'string' ? value : key;
  }

  getLocalizedValue(
    value: LocalizedString | string | null | undefined,
    fallback = 'en'
  ): string {
    if (!value) return '';
    if (typeof value === 'string') return value;

    const currentLang = this.currentLang();

    // 1. Try current language
    if (value[currentLang]) {
      return value[currentLang]!;
    }

    // 2. Try fallback language
    if (value[fallback]) {
      return value[fallback]!;
    }

    // 3. Return first available value
    const keys = Object.keys(value);
    if (keys.length > 0) {
      return value[keys[0]]!;
    }

    return '';
  }

  // Expose signal for pipe to react
  get translationsSignal() {
    return this.translations;
  }
}
