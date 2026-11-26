import { AnimatePresence, motion } from 'motion/react';
import type { Group, GroupActions } from '../types';
import { expenseInBase, formatMoney, fromMinor } from '../money';
import { enter, rowMotion } from '../fx';

type Props = { group: Group; actions: GroupActions };

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export default function ExpenseList({ group, actions }: Props) {
  const base = group.baseCurrency;
  const name = (id: string) => group.members.find((m) => m.id === id)?.name ?? '?';
  // Newest date first; within a date, most recently added first.
  const sorted = [...group.expenses].reverse().sort((a, b) => b.date.localeCompare(a.date));

  return (
    <motion.section className="card" {...enter(4)}>
      <h2>History</h2>
      {sorted.length === 0 ? (
        <div className="empty">—</div>
      ) : (
        <ul className="expenses">
          <AnimatePresence mode="popLayout" initial={false}>
            {sorted.map((e) => {
              const payment = e.kind === 'payment';
              const everyone = e.participants.length === group.members.length;
              return (
                <motion.li key={e.id} layout className={payment ? 'payment' : ''} {...rowMotion}>
                  <span className="expense-icon">{payment ? '↪' : e.description.charAt(0).toUpperCase()}</span>
                  <div className="grow">
                    <div className="desc">{e.description}</div>
                    <div className="meta">
                      {shortDate(e.date)}
                      {!payment &&
                        ` · ${name(e.paidBy)} · ${everyone ? 'everyone' : e.participants.map(name).join(', ')}`}
                    </div>
                  </div>
                  <div className="amount">
                    {formatMoney(fromMinor(expenseInBase(e, base), base), base)}
                    {e.currency !== base && <small>{formatMoney(e.amount, e.currency)}</small>}
                  </div>
                  <button
                    className="icon"
                    aria-label={`Delete ${e.description}`}
                    onClick={() => {
                      if (confirm(`Delete "${e.description}"?`)) actions.deleteExpense(e.id);
                    }}
                  >
                    ✕
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </motion.section>
  );
}
