import type { Expense, Group } from './types';

/** Number of minor-unit digits for a currency (USD → 2, JPY → 0, KWD → 3). */
export function minorDigits(currency: string): number {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

export const toMinor = (amount: number, currency: string) =>
  Math.round(amount * 10 ** minorDigits(currency));

export const fromMinor = (minor: number, currency: string) => minor / 10 ** minorDigits(currency);

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** Split an integer total into n integer shares that add up exactly; leftover units go to the first shares. */
export function splitEvenly(total: number, n: number): number[] {
  if (n <= 0) return [];
  const share = Math.floor(total / n);
  const remainder = total - share * n;
  return Array.from({ length: n }, (_, i) => share + (i < remainder ? 1 : 0));
}

/** Expense value in the base currency's minor units. */
export const expenseInBase = (e: Expense, base: string) => toMinor(e.amount * e.rate, base);

/**
 * Net balance per member, in base-currency minor units.
 * Positive = others owe them; negative = they owe others. Always sums to zero.
 */
export function computeBalances(group: Group): Record<string, number> {
  const bal: Record<string, number> = Object.fromEntries(group.members.map((m) => [m.id, 0]));
  for (const e of group.expenses) {
    if (e.participants.length === 0) continue;
    const total = expenseInBase(e, group.baseCurrency);
    bal[e.paidBy] = (bal[e.paidBy] ?? 0) + total;
    splitEvenly(total, e.participants.length).forEach((share, i) => {
      const p = e.participants[i];
      bal[p] = (bal[p] ?? 0) - share;
    });
  }
  return bal;
}

export type Transfer = { from: string; to: string; amount: number }; // amount in base minor units

/** Greedy settlement: biggest debtor pays biggest creditor until everyone is even. */
export function settleUp(balances: Record<string, number>): Transfer[] {
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < 0)
    .map(([id, v]) => ({ id, amt: -v }))
    .sort((a, b) => b.amt - a.amt);
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0)
    .map(([id, v]) => ({ id, amt: v }))
    .sort((a, b) => b.amt - a.amt);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    transfers.push({ from: debtors[i].id, to: creditors[j].id, amount: pay });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt === 0) i++;
    if (creditors[j].amt === 0) j++;
  }
  return transfers;
}
