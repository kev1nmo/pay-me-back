import { describe, expect, it } from 'vitest';
import { computeBalances, settleUp, splitEvenly, toMinor } from './money';
import type { Expense, Group } from './types';

const members = [
  { id: 'a', name: 'Alex' },
  { id: 'b', name: 'Sam' },
  { id: 'c', name: 'Jordan' },
];
const exp = (p: Partial<Expense>): Expense => ({
  id: Math.random().toString(),
  description: 'x',
  amount: 0,
  currency: 'USD',
  rate: 1,
  paidBy: 'a',
  participants: ['a', 'b', 'c'],
  date: '2026-11-25',
  ...p,
});
const group = (expenses: Expense[], baseCurrency = 'USD'): Group => ({
  id: 'g', name: 'g', baseCurrency, members, expenses, createdAt: '',
});

describe('splitEvenly', () => {
  it('splits exactly with remainder going to first shares', () => {
    expect(splitEvenly(1000, 3)).toEqual([334, 333, 333]);
    expect(splitEvenly(1000, 3).reduce((a, b) => a + b)).toBe(1000);
  });
});

describe('computeBalances', () => {
  it('handles a simple equal split', () => {
    const b = computeBalances(group([exp({ amount: 30 })]));
    expect(b).toEqual({ a: 2000, b: -1000, c: -1000 });
  });

  it('converts foreign currency with the saved rate', () => {
    // 100 EUR at 1.1 USD/EUR = $110, Sam paid, split with Alex
    const b = computeBalances(group([exp({ amount: 100, currency: 'EUR', rate: 1.1, paidBy: 'b', participants: ['a', 'b'] })]));
    expect(b).toEqual({ a: -5500, b: 5500, c: 0 });
  });

  it('uses zero-decimal base currencies correctly', () => {
    expect(toMinor(1000, 'JPY')).toBe(1000);
    const b = computeBalances(group([exp({ amount: 1000, currency: 'JPY' })], 'JPY'));
    expect(b.a + b.b + b.c).toBe(0);
    expect(b.a).toBe(666);
  });

  it('always nets to zero', () => {
    const b = computeBalances(group([
      exp({ amount: 10.01 }),
      exp({ amount: 7.77, paidBy: 'b', participants: ['b', 'c'] }),
      exp({ amount: 52, currency: 'GBP', rate: 1.27, paidBy: 'c' }),
    ]));
    expect(Object.values(b).reduce((x, y) => x + y)).toBe(0);
  });
});

describe('settleUp', () => {
  it('produces transfers that zero every balance', () => {
    const bal = { a: 5000, b: -3000, c: -2000 };
    const t = settleUp(bal);
    expect(t).toEqual([
      { from: 'b', to: 'a', amount: 3000 },
      { from: 'c', to: 'a', amount: 2000 },
    ]);
  });

  it('returns nothing when everyone is square', () => {
    expect(settleUp({ a: 0, b: 0 })).toEqual([]);
  });
});
