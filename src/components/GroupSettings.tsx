import type { Group } from '../types';
import CurrencySelect from './CurrencySelect';

type Props = {
  group: Group;
  updateGroup: (fn: (g: Group) => Group) => void;
  onDelete: () => void;
};

export default function GroupSettings({ group, updateGroup, onDelete }: Props) {
  const locked = group.expenses.length > 0;
  return (
    <details className="card">
      <summary>Group settings</summary>
      <label>
        Name
        <input value={group.name} onChange={(e) => updateGroup((g) => ({ ...g, name: e.target.value }))} />
      </label>
      <label>
        Settle up in
        <CurrencySelect
          value={group.baseCurrency}
          disabled={locked}
          onChange={(c) => updateGroup((g) => ({ ...g, baseCurrency: c }))}
        />
        {locked && <small className="muted">Locked once expenses exist (their rates are saved against it).</small>}
      </label>
      <button
        className="danger"
        onClick={() => {
          if (confirm(`Delete "${group.name}" and all its expenses? This can't be undone.`)) onDelete();
        }}
      >
        Delete group
      </button>
    </details>
  );
}
