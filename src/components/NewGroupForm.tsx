import { useState } from 'react';
import { motion } from 'motion/react';
import CurrencySelect from './CurrencySelect';
import PeopleInput from './PeopleInput';
import { errorMessage } from '../util';
import { enter } from '../fx';

type Props = {
  onCreate: (name: string, baseCurrency: string, members: string[]) => Promise<void>;
  onCancel?: () => void;
};

export default function NewGroupForm({ onCreate, onCancel }: Props) {
  const [name, setName] = useState('');
  const [base, setBase] = useState('USD');
  const [people, setPeople] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <motion.form
      {...enter()}
      className="card narrow hero"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim() || busy) return;
        setBusy(true);
        setError(null);
        try {
          await onCreate(name.trim(), base, people);
        } catch (err) {
          setError(errorMessage(err));
          setBusy(false);
        }
      }}
    >
      <h2>New group</h2>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </label>
      <label>
        Currency
        <CurrencySelect value={base} onChange={setBase} />
      </label>
      <label htmlFor="people">
        People
        <PeopleInput id="people" names={people} onChange={setPeople} />
      </label>
      {error && <small className="error">{error}</small>}
      <div className="row">
        <button type="submit" className="grow" disabled={!name.trim() || busy}>
          {busy ? 'Creating…' : 'Create group'}
        </button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </motion.form>
  );
}
