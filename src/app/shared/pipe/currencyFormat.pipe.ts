import { Pipe, PipeTransform } from '@angular/core';

type CurrencyCode = 'PEN' | 'USD' | 'EUR';

interface CurrencyConfig {
  symbol: string;
  locale: string;
}

const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyConfig> = {
  PEN: { symbol: 'S/',  locale: 'es-PE' },
  USD: { symbol: '$',   locale: 'en-US' },
  EUR: { symbol: '€',   locale: 'es-ES' },
};

@Pipe({
  name: 'currencyFormat',
  standalone: true,
  pure: true,
})
export class CurrencyFormatPipe implements PipeTransform {

  transform(
    value: number | string | null | undefined,
    currency: CurrencyCode = 'PEN',
    decimals: number = 2,
  ): string {
    if (value === null || value === undefined || value === '') return '—';

    const numeric = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (!Number.isFinite(numeric)) return '—';

    const config = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG['PEN'];

    const formatted = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numeric);

    const withApostrophe = formatted.replace(/,/g, "'");

    return `${config.symbol} ${withApostrophe}`;
  }
}
