import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

type Props = { names: string[]; onChange: (names: string[]) => void; id?: string };

/** Type a name and press Enter or comma to add it as a chip. Backspace removes the last one. */
export default function PeopleInput({ names, onChange, id }: Props) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const next = [...names];
    for (const part of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
      if (!next.some((n) => n.toLowerCase() === part.toLowerCase())) next.push(part);
    }
    if (next.length !== names.length) onChange(next);
    setDraft('');
  };

  return (
    <div className="people-input" onClick={() => inputRef.current?.focus()}>
      <AnimatePresence initial={false}>
        {names.map((n) => (
          <motion.span
            key={n}
            className="chip"
            layout
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          >
            {n}
            <button
              type="button"
              className="chip-x"
              aria-label={`Remove ${n}`}
              onClick={() => onChange(names.filter((x) => x !== n))}
            >
              ×
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <input
        id={id}
        ref={inputRef}
        value={draft}
        onChange={(e) => (e.target.value.includes(',') ? commit(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && draft.trim()) {
            e.preventDefault();
            commit(draft);
          } else if (e.key === 'Backspace' && !draft && names.length) {
            onChange(names.slice(0, -1));
          }
        }}
        onBlur={() => draft.trim() && commit(draft)}
        aria-label="Add a person"
      />
    </div>
  );
}
