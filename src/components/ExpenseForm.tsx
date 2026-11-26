import { useEffect, useState } from 'react';
import type { Group, GroupActions } from '../types';
import type { RateTable } from '../rates';
import { rateToBase } from '../rates';
import { formatMoney } from '../money';
import { today } from '../util';
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

  if (group.members.length === 0) {
    return (
      <section className="card">
        <h2>Add an expense</h2>
        <p className="muted">Add at least one person first.</p>
      </section>
    );
  }

  const participants = group.members.filter((m) => !excluded.has(m.id)).map((m) => m.id);
  const amountNum = Number(amount);
  const rateNum = Number(rateInput);
  const valid =
    description.trim() !== '' && amountNum > 0 && rateNum > 0 && paidBy !== '' && participants.length > 0;
  const converted = amountNum > 0 && rateNum > 0 ? amountNum * rateNum : null;

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
      setDescription('');
      setAmount('');
      setRateEdited(false);
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>Add an expense</h2>

      <label>
        What for?
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Dinner at Ichiran" />
      </label>

      <div className="row">
        <label className="grow">
          Amount
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </label>
        <label className="grow">
          Currency
          <CurrencySelect
            value={currency}
            onChange={(c) => {
              setCurrency(c);
              setRateEdited(false);
            }}
          />
        </label>
      </div>

      {currency !== base && (
        <div className="rate-box">
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
          </div>
          <small className="muted">
            {rates.loading && 'Loading live rates…'}
            {!rates.loading && rateEdited && liveRate && (
              <>
                Custom rate.{' '}
                <button type="button" className="link" onClick={() => setRateEdited(false)}>
                  Use live rate ({fmtRate(liveRate)})
                </button>
              </>
            )}
            {!rates.loading && !rateEdited && liveRate && rates.table &&
              `Live rate, updated ${new Date(rates.table.updated).toLocaleDateString()}${rates.table.stale ? ' (offline — cached)' : ''}`}
            {!rates.loading && !liveRate && (
              <span className="error">
                {rates.error ? `Couldn't load rates (${rates.error}).` : `No live rate for ${currency}.`} Enter the rate
                manually.
              </span>
            )}
          </small>
          {converted !== null && <div className="converted">≈ {formatMoney(converted, base)}</div>}
        </div>
      )}

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

      <fieldset>
        <legend>
          Split equally between{' '}
          <button
            type="button"
            className="link"
            onClick={() => setExcluded(participants.length === group.members.length ? new Set(group.members.map((m) => m.id)) : new Set())}
          >
            {participants.length === group.members.length ? 'none' : 'all'}
          </button>
        </legend>
        <div className="checks">
          {group.members.map((m) => (
            <label key={m.id} className="check">
              <input type="checkbox" checked={!excluded.has(m.id)} onChange={() => toggle(m.id)} />
              {m.name}
            </label>
          ))}
        </div>
        {participants.length > 0 && converted !== null && (
          <small className="muted">
            {formatMoney(converted / participants.length, base)} each
          </small>
        )}
      </fieldset>

      <button type="submit" disabled={!valid || saving}>
        {saving ? 'Saving…' : 'Add expense'}
      </button>
    </form>
  );
}
