export const COMMON_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'SGD',
  'KRW', 'INR', 'MXN', 'BRL', 'NZD', 'SEK', 'NOK', 'DKK', 'THB', 'TWD',
];

export const ALL_CURRENCIES: string[] = (() => {
  try {
    return Intl.supportedValuesOf('currency');
  } catch {
    return [...COMMON_CURRENCIES].sort();
  }
})();

const names = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'currency' });
  } catch {
    return null;
  }
})();

export const currencyName = (code: string) => names?.of(code) ?? code;
