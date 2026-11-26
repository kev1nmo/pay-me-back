import type { Group, GroupActions } from '../types';
import { computeBalances, expenseInBase, formatMoney, fromMinor, settleUp } from '../money';
import { today } from '../util';

type Props = { group: Group; actions: GroupActions };

export default function Balances({ group, actions }: Props) {
  const base = group.baseCurrency;
  const balances = computeBalances(group);
  const transfers = settleUp(balances);
  const name = (id: string) => group.members.find((m) => m.id === id)?.name ?? '?';
  const fmt = (minor: number) => formatMoney(fromMinor(minor, base), base);

  const totalSpent = group.expenses
    .filter((e) => e.kind !== 'payment')
    .reduce((sum, e) => sum + expenseInBase(e, base), 0);

  const markPaid = (from: string, to: string, minor: number) =>
    actions.addExpense({
      description: `${name(from)} paid ${name(to)}`,
      amount: fromMinor(minor, base),
      currency: base,
      rate: 1,
      paidBy: from,
      participants: [to],
      date: today(),
      kind: 'payment',
    });

  return (
    <section className="card">
      <div className="row between">
        <h2>Balances</h2>
        <span className="muted">Total spent: {fmt(totalSpent)}</span>
      </div>

      {group.members.length === 0 ? (
        <p className="muted">No one here yet.</p>
      ) : (
        <ul className="balances">
          {group.members.map((m) => {
            const v = balances[m.id] ?? 0;
            return (
              <li key={m.id}>
                <span>{m.name}</span>
                <span className={v > 0 ? 'pos' : v < 0 ? 'neg' : 'muted'}>
                  {v > 0 ? `gets back ${fmt(v)}` : v < 0 ? `owes ${fmt(-v)}` : 'settled'}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <h3>Settle up</h3>
      {transfers.length === 0 ? (
        <p className="muted">{group.expenses.length ? 'Everyone is square. 🎉' : 'Add an expense to see who owes whom.'}</p>
      ) : (
        <ul className="transfers">
          {transfers.map((t) => (
            <li key={`${t.from}-${t.to}`}>
              <span>
                <strong>{name(t.from)}</strong> pays <strong>{name(t.to)}</strong> {fmt(t.amount)}
              </span>
              <button className="secondary small" onClick={() => markPaid(t.from, t.to, t.amount)}>
                Mark paid
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
