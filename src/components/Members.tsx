import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Group, GroupActions } from '../types';
import { enter } from '../fx';

type Props = { group: Group; actions: GroupActions };

export default function Members({ group, actions }: Props) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const trimmed = name.trim();
  const duplicate = group.members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase());

  const isUsed = (id: string) =>
    group.expenses.some((e) => e.paidBy === id || e.participants.includes(id));

  return (
    <motion.section className="card" {...enter(1)}>
      <h2>People</h2>
      {group.members.length > 0 && (
        <ul className="chips">
          <AnimatePresence initial={false}>
            {group.members.map((m) => (
              <motion.li
                key={m.id}
                className="chip"
                layout
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              >
                <span className="avatar">{m.name.charAt(0).toUpperCase()}</span>
                {m.name}
                <button
                  className="chip-x"
                  aria-label={`Remove ${m.name}`}
                  disabled={isUsed(m.id)}
                  title={isUsed(m.id) ? 'In an expense' : 'Remove'}
                  onClick={() => actions.removeMember(m.id)}
                >
                  ×
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
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
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Add a person" />
        <button type="submit" className="secondary" disabled={!trimmed || duplicate || busy}>
          + Add
        </button>
      </form>
    </motion.section>
  );
}
