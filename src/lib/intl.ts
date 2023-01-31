import { isPresent, verified } from '@starbeam/verify';

export const DATE_STYLE = ['full', 'long', 'medium', 'short'] as const;
export type DateStyle = Intl.DateTimeFormatOptions['dateStyle'];
export const TIME_STYLE = ['full', 'long', 'medium', 'short'] as const;
export type TimeStyle = Intl.DateTimeFormatOptions['timeStyle'];

export const RESOLVED = new Intl.DateTimeFormat().resolvedOptions();
export const SYS_TZ = RESOLVED.timeZone;
export const SYS_LOCALE = RESOLVED.locale;

export function isValidLocale(locale: string): boolean {
  try {
    Intl.getCanonicalLocales([locale]);
    return true;
  } catch {
    return false;
  }
}

export class LocaleInfo {
  static of(locale: string): LocaleInfo {
    return new LocaleInfo(new Intl.Locale(locale));
  }

  readonly #locale: Intl.Locale;
  readonly #displayLocale: Intl.Locale;

  constructor(locale: Intl.Locale, displayLocale = locale) {
    this.#locale = locale;
    this.#displayLocale = displayLocale;
  }

  get language(): string {
    const names = new Intl.DisplayNames([this.#displayLocale], {
      type: 'language',
    });

    return verified(
      names.of(verified(this.#locale.language, isPresent)),
      isPresent
    );
  }

  get region(): string {
    const names = new Intl.DisplayNames([this.#displayLocale], {
      type: 'region',
    });

    return verified(
      names.of(verified(this.#locale.region, isPresent)),
      isPresent
    );
  }
}
