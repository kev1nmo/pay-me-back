import type { Group } from '../types';
import { expenseInBase, formatMoney, fromMinor } from '../money';

type Props = { group: Group; updateGroup: (fn: (g: Group) => Group) => void };

export default function ExpenseList({ group, updateGroup }: Props) {
  const base = group.baseCurrency;
  const name = (id: string) => group.members.find((m) => m.id === id)?.name ?? '?';
  const sorted = [...group.expenses].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section className="card">
      <h2>History</h2>
      {sorted.length === 0 ? (
        <p className="muted">Nothing yet.</p>
      ) : (
        <ul className="expenses">
          {sorted.map((e) => {
            const everyone = e.participants.length === group.members.length;
            return (
              <li key={e.id} className={e.kind === 'payment' ? 'payment' : ''}>
                <div className="grow">
                  <div className="desc">{e.kind === 'payment' ? '↪ ' : ''}{e.description}</div>
                  <small className="muted">
                    {e.date} ·{' '}
                    {e.kind === 'payment'
                      ? 'repayment'
                      : `${name(e.paidBy)} paid · split ${everyone ? 'by everyone' : `with ${e.participants.map(name).join(', ')}`}`}
                  </small>
                </div>
                <div className="amount">
                  <div>{formatMoney(fromMinor(expenseInBase(e, base), base), base)}</div>
                  {e.currency !== base && (
                    <small className="muted">
                      {formatMoney(e.amount, e.currency)} @ {Number(e.rate.toPrecision(4))}
                    </small>
                  )}
                </div>
                <button
                  className="icon"
                  aria-label={`Delete ${e.description}`}
                  onClick={() => {
                    if (confirm(`Delete "${e.description}"?`))
                      updateGroup((g) => ({ ...g, expenses: g.expenses.filter((x) => x.id !== e.id) }));
                  }}
                >
                  🗑
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
