import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { Group, GroupActions } from '../types';
import CurrencySelect from './CurrencySelect';
import { enter } from '../fx';

type Props = { group: Group; actions: GroupActions };

export default function GroupSettings({ group, actions }: Props) {
  const [name, setName] = useState(group.name);
  useEffect(() => setName(group.name), [group.name]);
  const locked = group.expenses.length > 0;
  const trimmed = name.trim();

  return (
    <motion.details className="card" {...enter(5)}>
      <summary>Settings</summary>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (trimmed && trimmed !== group.name) actions.rename(trimmed);
        }}
      >
        <label className="grow">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button type="submit" className="secondary" disabled={!trimmed || trimmed === group.name}>
          Save
        </button>
      </form>
      <label title={locked ? 'Locked once expenses exist' : undefined}>
        Currency
        <CurrencySelect value={group.baseCurrency} disabled={locked} onChange={(c) => actions.setBaseCurrency(c)} />
      </label>
      <button
        className="danger"
        onClick={() => {
          if (confirm(`Delete "${group.name}" for everyone?`)) actions.deleteGroup();
        }}
      >
        Delete group
      </button>
    </motion.details>
  );
}
