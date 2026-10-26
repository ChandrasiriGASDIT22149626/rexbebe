export type SupportedCurrency = 'LKR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'AED';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  rateVsLkr: number; // Conversion rate relative to LKR base
  locale: string;
}

export const CURRENCY_CONFIGS: Record<SupportedCurrency, CurrencyConfig> = {
  LKR: { code: 'LKR', symbol: 'Rs.', rateVsLkr: 1, locale: 'en-LK' },
  USD: { code: 'USD', symbol: '$', rateVsLkr: 0.0033, locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', rateVsLkr: 0.0030, locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', rateVsLkr: 0.0026, locale: 'en-GB' },
  AUD: { code: 'AUD', symbol: 'A$', rateVsLkr: 0.0050, locale: 'en-AU' },
  AED: { code: 'AED', symbol: 'AED', rateVsLkr: 0.012, locale: 'ar-AE' },
};

export const formatCurrency = (amountInLkr: number, targetCurrency: SupportedCurrency = 'LKR'): string => {
  const config = CURRENCY_CONFIGS[targetCurrency] || CURRENCY_CONFIGS.LKR;
  const converted = amountInLkr * config.rateVsLkr;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: targetCurrency === 'LKR' ? 0 : 2,
    maximumFractionDigits: targetCurrency === 'LKR' ? 0 : 2,
  }).format(converted);
};

