import { useState } from 'react';
import CurrencySelect from './CurrencySelect';

type Props = {
  onCreate: (name: string, baseCurrency: string, members: string[]) => void;
  onCancel?: () => void;
};

export default function NewGroupForm({ onCreate, onCancel }: Props) {
  const [name, setName] = useState('');
  const [base, setBase] = useState('USD');
  const [people, setPeople] = useState('');

  const names = [...new Set(people.split(',').map((s) => s.trim()).filter(Boolean))];

  return (
    <form
      className="card narrow"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onCreate(name.trim(), base, names);
      }}
    >
      <h2>Start a group</h2>
      <p className="muted">A trip, a house, a dinner — anything you're splitting costs for.</p>
      <label>
        Group name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tokyo trip 2026" required autoFocus />
      </label>
      <label>
        Settle up in
        <CurrencySelect value={base} onChange={setBase} />
        <small className="muted">Everyone's balance is shown in this currency.</small>
      </label>
      <label>
        Who's in?
        <input value={people} onChange={(e) => setPeople(e.target.value)} placeholder="Alex, Sam, Jordan" />
        <small className="muted">Comma-separated. You can add more later.</small>
      </label>
      <div className="row">
        <button type="submit" disabled={!name.trim()}>
          Create group
        </button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
