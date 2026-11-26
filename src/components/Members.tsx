import { useState } from 'react';
import type { Group } from '../types';
import { newId } from '../storage';

type Props = { group: Group; updateGroup: (fn: (g: Group) => Group) => void };

export default function Members({ group, updateGroup }: Props) {
  const [name, setName] = useState('');
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
              title={isUsed(m.id) ? 'Part of an expense — delete those first' : 'Remove'}
              onClick={() =>
                updateGroup((g) => ({ ...g, members: g.members.filter((x) => x.id !== m.id) }))
              }
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!trimmed || duplicate) return;
          updateGroup((g) => ({ ...g, members: [...g.members, { id: newId(), name: trimmed }] }));
          setName('');
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a person" aria-label="Name" />
        <button type="submit" disabled={!trimmed || duplicate}>
          Add
        </button>
      </form>
      {duplicate && trimmed && <small className="error">{trimmed} is already in the group.</small>}
    </section>
  );
}
