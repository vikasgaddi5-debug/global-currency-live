// Currency metadata used for display purposes (flag emoji, full name, symbol).
// This is NOT rate data — rates always come live from the API service.
// List covers ISO 4217 currencies typically returned by open.er-api.com / exchangerate.host.
export const CURRENCY_META = {
  USD: { country: 'United States', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  EUR: { country: 'European Union', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  GBP: { country: 'United Kingdom', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  INR: { country: 'India', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  JPY: { country: 'Japan', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  AUD: { country: 'Australia', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  CAD: { country: 'Canada', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  CHF: { country: 'Switzerland', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  CNY: { country: 'China', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  HKD: { country: 'Hong Kong', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  NZD: { country: 'New Zealand', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  SEK: { country: 'Sweden', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  KRW: { country: 'South Korea', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  SGD: { country: 'Singapore', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  NOK: { country: 'Norway', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  MXN: { country: 'Mexico', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  AED: { country: 'United Arab Emirates', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  SAR: { country: 'Saudi Arabia', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
  ZAR: { country: 'South Africa', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  BRL: { country: 'Brazil', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  RUB: { country: 'Russia', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  TRY: { country: 'Turkey', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  THB: { country: 'Thailand', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  IDR: { country: 'Indonesia', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  MYR: { country: 'Malaysia', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  PHP: { country: 'Philippines', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  PLN: { country: 'Poland', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
  DKK: { country: 'Denmark', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  ILS: { country: 'Israel', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱' },
  VND: { country: 'Vietnam', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  EGP: { country: 'Egypt', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬' },
  PKR: { country: 'Pakistan', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰' },
  BDT: { country: 'Bangladesh', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩' },
  NGN: { country: 'Nigeria', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  ARS: { country: 'Argentina', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷' },
  CLP: { country: 'Chile', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱' },
  COP: { country: 'Colombia', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴' },
  CZK: { country: 'Czech Republic', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
  HUF: { country: 'Hungary', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺' },
  QAR: { country: 'Qatar', name: 'Qatari Riyal', symbol: '﷼', flag: '🇶🇦' },
  KWD: { country: 'Kuwait', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼' },
  LKR: { country: 'Sri Lanka', name: 'Sri Lankan Rupee', symbol: '₨', flag: '🇱🇰' },
  UAH: { country: 'Ukraine', name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦' },
  TWD: { country: 'Taiwan', name: 'New Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼' },
  // Fallback entries are generated dynamically for any ISO code returned by the
  // API but not listed here — see getCurrencyMeta() in utils/currency.js
};

export const DEFAULT_BASE_CURRENCY = 'INR';

export const REFRESH_INTERVALS = [
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '5 minutes', value: 300 },
  { label: '15 minutes', value: 900 },
  { label: 'Manual only', value: 0 },
];

export const CHART_RANGES = ['1H', '4H', '1D', '5D', '1M', '3M', '6M', '1Y', '5Y', 'MAX'];

export const TREND_THRESHOLDS = {
  strongUp: 1.5,
  up: 0.3,
  down: -0.3,
  strongDown: -1.5,
};
