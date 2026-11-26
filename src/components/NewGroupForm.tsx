import { useState } from 'react';
import CurrencySelect from './CurrencySelect';
import { errorMessage } from '../util';

type Props = {
  onCreate: (name: string, baseCurrency: string, members: string[]) => Promise<void>;
  onCancel?: () => void;
};

export default function NewGroupForm({ onCreate, onCancel }: Props) {
  const [name, setName] = useState('');
  const [base, setBase] = useState('USD');
  const [people, setPeople] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const names = [...new Set(people.split(',').map((s) => s.trim()).filter(Boolean))];

  return (
    <form
      className="card narrow"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim() || busy) return;
        setBusy(true);
        setError(null);
        try {
          await onCreate(name.trim(), base, names);
        } catch (err) {
          setError(errorMessage(err));
          setBusy(false);
        }
      }}
    >
      <h2>Start a group</h2>
      <p className="muted">A trip, a house, a dinner. You'll get a link to share with everyone.</p>
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
        <small className="muted">Comma-separated. Anyone can add more later.</small>
      </label>
      {error && <small className="error">{error}</small>}
      <div className="row">
        <button type="submit" disabled={!name.trim() || busy}>
          {busy ? 'Creating…' : 'Create group'}
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
