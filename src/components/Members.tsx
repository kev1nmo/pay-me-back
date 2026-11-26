import { useState } from 'react';
import type { Group, GroupActions } from '../types';

type Props = { group: Group; actions: GroupActions };

export default function Members({ group, actions }: Props) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const trimmed = name.trim();
  const duplicate = group.members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase());

  const isUsed = (id: string) =>
    group.expenses.some((e) => e.paidBy === id || e.participants.includes(id));

  return (
    <section className="card">
      <h2>People</h2>
      {group.members.length === 0 && <p className="muted">Add the people splitting costs.</p>}
      <ul className="chips">
        {group.members.map((m) => (
          <li key={m.id} className="chip">
            {m.name}
            <button
              className="chip-x"
              aria-label={`Remove ${m.name}`}
              disabled={isUsed(m.id)}
              title={isUsed(m.id) ? 'Part of an expense. Delete those first.' : 'Remove'}
              onClick={() => actions.removeMember(m.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form
        className="row"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!trimmed || duplicate || busy) return;
          setBusy(true);
          if (await actions.addMember(trimmed)) setName('');
          setBusy(false);
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a person" aria-label="Name" />
        <button type="submit" disabled={!trimmed || duplicate || busy}>
          Add
        </button>
      </form>
      {duplicate && trimmed && <small className="error">{trimmed} is already in the group.</small>}
    </section>
  );
}
