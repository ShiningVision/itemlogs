type RateCache = { rate: number; fetchedAt: number };

const cache = new Map<string, RateCache>();
const ONE_HOUR_MS = 60 * 60 * 1000;

export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const key = `${from}_${to}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < ONE_HOUR_MS) {
    return cached.rate;
  }

  try {
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`);
    if (!res.ok) throw new Error(`Frankfurter returned ${res.status}`);

    const json = await res.json();
    const rate = json.rates?.[to];
    if (typeof rate !== 'number') throw new Error(`No rate found for ${from} -> ${to}`);

    cache.set(key, { rate, fetchedAt: Date.now() });
    return rate;
  } catch (error) {
    console.error(`Failed to fetch exchange rate ${from} -> ${to}:`, error);
    if (cached) return cached.rate; // serve stale rather than fail outright
    throw new Error(`Unable to determine exchange rate for ${from} -> ${to}`);
  }
}