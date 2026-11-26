import { useEffect, useState } from 'react';
import type { Group, GroupActions } from '../types';
import CurrencySelect from './CurrencySelect';

type Props = { group: Group; actions: GroupActions };

export default function GroupSettings({ group, actions }: Props) {
  const [name, setName] = useState(group.name);
  useEffect(() => setName(group.name), [group.name]);
  const locked = group.expenses.length > 0;
  const trimmed = name.trim();

  return (
    <details className="card">
      <summary>Group settings</summary>
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
      <label>
        Settle up in
        <CurrencySelect value={group.baseCurrency} disabled={locked} onChange={(c) => actions.setBaseCurrency(c)} />
        {locked && <small className="muted">Locked once expenses exist, because their rates are saved against it.</small>}
      </label>
      <button
        className="danger"
        onClick={() => {
          if (confirm(`Delete "${group.name}" and all its expenses for everyone? This can't be undone.`))
            actions.deleteGroup();
        }}
      >
        Delete group
      </button>
    </details>
  );
}
