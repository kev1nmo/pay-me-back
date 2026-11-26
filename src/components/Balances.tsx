import { AnimatePresence, motion } from 'motion/react';
import type { Group, GroupActions } from '../types';
import { computeBalances, expenseInBase, fromMinor, settleUp } from '../money';
import { today } from '../util';
import { burst, enter, EASE, rowMotion } from '../fx';
import AnimatedMoney from './AnimatedMoney';

type Props = { group: Group; actions: GroupActions };

export default function Balances({ group, actions }: Props) {
  const base = group.baseCurrency;
  const balances = computeBalances(group);
  const transfers = settleUp(balances);
  const name = (id: string) => group.members.find((m) => m.id === id)?.name ?? '?';
  const major = (minor: number) => fromMinor(minor, base);
  const maxAbs = Math.max(1, ...Object.values(balances).map(Math.abs));

  const totalSpent = group.expenses
    .filter((e) => e.kind !== 'payment')
    .reduce((sum, e) => sum + expenseInBase(e, base), 0);

  const markPaid = (from: string, to: string, minor: number, button: HTMLElement) => {
    burst(button, 18);
    actions.addExpense({
      description: `${name(from)} paid ${name(to)}`,
      amount: major(minor),
      currency: base,
      rate: 1,
      paidBy: from,
      participants: [to],
      date: today(),
      kind: 'payment',
    });
  };

  return (
    <motion.section className="card" {...enter(3)}>
      <div>
        <div className="total-label">Total spent</div>
        <AnimatedMoney className="total" value={major(totalSpent)} currency={base} />
      </div>

      {group.members.length > 0 && (
        <ul className="balances">
          {group.members.map((m) => {
            const v = balances[m.id] ?? 0;
            const pct = (Math.abs(v) / maxAbs) * 50;
            return (
              <li key={m.id} className="balance-row">
                <span className="who">{m.name}</span>
                <span className={`amt ${v > 0 ? 'pos' : v < 0 ? 'neg' : 'muted'}`}>
                  {v === 0 ? (
                    'settled'
                  ) : (
                    <>
                      <span className="amt-word">{v > 0 ? 'gets ' : 'owes '}</span>
                      <AnimatedMoney value={major(Math.abs(v))} currency={base} />
                    </>
                  )}
                </span>
                <div className="bar">
                  <motion.div
                    className={`bar-fill ${v >= 0 ? 'pos' : 'neg'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: EASE }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {group.expenses.length > 0 && (
        <>
          <h3>Settle up</h3>
          <AnimatePresence mode="popLayout" initial={false}>
            {transfers.length === 0 ? (
              <motion.div
                key="square"
                className="square"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              >
                All square 🎉
              </motion.div>
            ) : (
              <motion.ul key="list" className="transfers" exit={{ opacity: 0 }}>
                <AnimatePresence mode="popLayout" initial={false}>
                  {transfers.map((t) => (
                    <motion.li key={`${t.from}-${t.to}`} layout {...rowMotion}>
                      <span className="transfer-text">
                        <strong>{name(t.from)}</strong>
                        <span className="arrow">→</span>
                        <strong>{name(t.to)}</strong>
                        <AnimatedMoney className="transfer-amt" value={major(t.amount)} currency={base} />
                      </span>
                      <button
                        className="secondary small"
                        onClick={(e) => markPaid(t.from, t.to, t.amount, e.currentTarget)}
                      >
                        Paid
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.section>
  );
}
