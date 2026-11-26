// Exchange rates from https://www.exchangerate-api.com (open access endpoint, no API key).
// Rates update once a day, so we cache them in localStorage for a few hours.

export type RateTable = {
  base: string;
  /** Units of each currency per 1 unit of `base`. */
  rates: Record<string, number>;
  updated: string;
  fetchedAt: number;
  stale?: boolean;
};

const TTL_MS = 6 * 60 * 60 * 1000;
const cacheKey = (base: string) => `pmb:rates:${base}`;

function readCache(base: string): RateTable | null {
  try {
    const raw = localStorage.getItem(cacheKey(base));
    return raw ? (JSON.parse(raw) as RateTable) : null;
  } catch {
    return null;
  }
}

export async function fetchRates(base: string): Promise<RateTable> {
  const cached = readCache(base);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached;

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
    if (!res.ok) throw new Error(`Rate service returned HTTP ${res.status}`);
    const data = await res.json();
    if (data.result !== 'success') throw new Error(data['error-type'] ?? 'Rate lookup failed');
    const table: RateTable = {
      base,
      rates: data.rates,
      updated: data.time_last_update_utc,
      fetchedAt: Date.now(),
    };
    localStorage.setItem(cacheKey(base), JSON.stringify(table));
    return table;
  } catch (err) {
    if (cached) return { ...cached, stale: true }; // offline: fall back to old rates
    throw err;
  }
}

/** How many units of the base currency 1 unit of `currency` is worth. */
export function rateToBase(table: RateTable | null, currency: string): number | undefined {
  if (!table) return undefined;
  if (currency === table.base) return 1;
  const r = table.rates[currency];
  return r ? 1 / r : undefined;
}
