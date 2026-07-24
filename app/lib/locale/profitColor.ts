// app/lib/locale/profitColor.ts
// Profit/loss color convention isn't universal: Western finance uses green
// for gains and red for losses, but China, Japan, and Korea traditionally
// use the opposite — red marks a gain (auspicious), green marks a loss —
// same convention you'll see on Shanghai/Tokyo/Seoul stock tickers. The
// number's sign is always the actual source of truth; only which color is
// used to represent "this is good news" flips per locale.
const REVERSED_LOCALES = new Set(['zh', 'ja', 'ko']);

export type ProfitColorClass = 'catalog-card-profit--green' | 'catalog-card-profit--red';

export function getProfitColorClass(profit: number, locale: string): ProfitColorClass {
  const isGain = profit >= 0;
  const reversed = REVERSED_LOCALES.has(locale.split('-')[0].toLowerCase());
  const useGreen = reversed ? !isGain : isGain;
  return useGreen ? 'catalog-card-profit--green' : 'catalog-card-profit--red';
}
