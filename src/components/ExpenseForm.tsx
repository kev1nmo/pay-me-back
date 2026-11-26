import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Group, GroupActions } from '../types';
import type { RateTable } from '../rates';
import { rateToBase } from '../rates';
import { formatMoney } from '../money';
import { today } from '../util';
import { burst, enter, EASE } from '../fx';
import CurrencySelect from './CurrencySelect';

type Props = {
  group: Group;
  rates: { table: RateTable | null; error: string | null; loading: boolean };
  actions: GroupActions;
};

const fmtRate = (r: number) => String(Number(r.toPrecision(6)));

export default function ExpenseForm({ group, rates, actions }: Props) {
  const base = group.baseCurrency;
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(base);
  const [rateInput, setRateInput] = useState('1');
  const [rateEdited, setRateEdited] = useState(false);
  const [paidBy, setPaidBy] = useState(group.members[0]?.id ?? '');
  // Track who's *excluded* so newly added people are included by default.
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  const liveRate = rateToBase(rates.table, currency);

  // Fill in the live rate whenever the currency changes (unless the user typed their own).
  useEffect(() => {
    if (rateEdited) return;
    if (currency === base) setRateInput('1');
    else setRateInput(liveRate ? fmtRate(liveRate) : '');
  }, [currency, base, liveRate, rateEdited]);

  // Keep "paid by" valid if members change.
  useEffect(() => {
    if (!group.members.some((m) => m.id === paidBy)) setPaidBy(group.members[0]?.id ?? '');
  }, [group.members, paidBy]);

  if (group.members.length === 0) return null;

  const participants = group.members.filter((m) => !excluded.has(m.id)).map((m) => m.id);
  const amountNum = Number(amount);
  const rateNum = Number(rateInput);
  const valid =
    description.trim() !== '' && amountNum > 0 && rateNum > 0 && paidBy !== '' && participants.length > 0;
  const converted = amountNum > 0 && rateNum > 0 ? amountNum * rateNum : null;
  const allIn = participants.length === group.members.length;

  const toggle = (id: string) =>
    setExcluded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    const ok = await actions.addExpense({
      description: description.trim(),
      amount: amountNum,
      currency,
      rate: currency === base ? 1 : rateNum,
      paidBy,
      participants,
      date,
      kind: 'expense',
    });
    setSaving(false);
    if (ok) {
      burst(submitRef.current);
      setDescription('');
      setAmount('');
      setRateEdited(false);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1400);
    }
  };

  return (
    <motion.form className="card" onSubmit={submit} {...enter(2)}>
      <h2>Add expense</h2>

      <div className="row">
        <label className="grow">
          Amount
          <input
            className="amount-input"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label style={{ width: 110 }}>
          Currency
          <CurrencySelect
            compact
            value={currency}
            onChange={(c) => {
              setCurrency(c);
              setRateEdited(false);
            }}
          />
        </label>
      </div>

      <label>
        Description
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <AnimatePresence initial={false}>
        {currency !== base && (
          <motion.div
            className="rate-box"
            initial={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', paddingTop: 12, paddingBottom: 12 }}
            exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="row center">
              <span>1 {currency} =</span>
              <input
                className="rate-input"
                type="number"
                step="any"
                min="0"
                value={rateInput}
                onChange={(e) => {
                  setRateInput(e.target.value);
                  setRateEdited(true);
                }}
                aria-label={`Exchange rate ${currency} to ${base}`}
              />
              <span>{base}</span>
              <span className="grow" />
              {converted !== null && (
                <motion.span key={converted} className="converted" initial={{ scale: 1.15 }} animate={{ scale: 1 }}>
                  {formatMoney(converted, base)}
                </motion.span>
              )}
            </div>
            <div className="rate-meta">
              {rates.loading ? (
                <span>…</span>
              ) : rateEdited && liveRate ? (
                <>
                  <span>custom</span>
                  <button type="button" className="link" onClick={() => setRateEdited(false)}>
                    reset to {fmtRate(liveRate)}
                  </button>
                </>
              ) : liveRate ? (
                <span title={rates.table ? `Updated ${new Date(rates.table.updated).toLocaleString()}` : undefined}>
                  <span className="live-dot" style={{ display: 'inline-block', marginRight: 6 }} />
                  {rates.table?.stale ? 'cached rate' : 'live rate'}
                </span>
              ) : (
                <span className="error">No live rate. Enter one.</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="row">
        <label className="grow">
          Paid by
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {group.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grow">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      <div>
        <div className="split-head">
          <span>
            Split ·{' '}
            <button
              type="button"
              className="link"
              onClick={() => setExcluded(allIn ? new Set(group.members.map((m) => m.id)) : new Set())}
            >
              {allIn ? 'none' : 'all'}
            </button>
          </span>
          <AnimatePresence>
            {participants.length > 0 && converted !== null && (
              <motion.span
                className="each"
                key={participants.length}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {formatMoney(converted / participants.length, base)} each
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="pills" style={{ marginTop: 8 }}>
          {group.members.map((m) => {
            const on = !excluded.has(m.id);
            return (
              <motion.button
                key={m.id}
                type="button"
                className={`pill ${on ? 'on' : ''}`}
                aria-pressed={on}
                onClick={() => toggle(m.id)}
                whileTap={{ scale: 0.9 }}
                layout
              >
                {on ? '✓ ' : ''}
                {m.name}
              </motion.button>
            );
          })}
        </div>
      </div>

      <button ref={submitRef} type="submit" disabled={!valid || saving} className={justAdded ? 'success' : ''}>
        {saving ? 'Saving…' : justAdded ? 'Added ✓' : 'Add expense'}
      </button>
    </motion.form>
  );
}
