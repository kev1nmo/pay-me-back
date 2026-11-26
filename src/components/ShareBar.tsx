import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Group } from '../types';
import { groupLink } from '../util';
import { burst, enter } from '../fx';

export default function ShareBar({ group }: { group: Group }) {
  const [copied, setCopied] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const link = groupLink(group.id);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: group.name, url: link });
        return;
      } catch {
        // cancelled or unsupported: fall through to copy
      }
    }
    await navigator.clipboard.writeText(link);
    burst(btn.current, 8);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.section className="share-bar" {...enter()}>
      <div className="grow">
        <h2>{group.name}</h2>
        <div className="tags">
          <span className="tag">{group.baseCurrency}</span>
          <span className="tag">
            {group.members.length} {group.members.length === 1 ? 'person' : 'people'}
          </span>
          <span className="tag" title="Updates live">
            <span className="live-dot" /> LIVE
          </span>
        </div>
      </div>
      <button ref={btn} onClick={share} className={copied ? 'success' : ''}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? 'copied' : 'invite'}
            style={{ display: 'inline-block' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {copied ? 'Copied ✓' : 'Invite'}
          </motion.span>
        </AnimatePresence>
      </button>
    </motion.section>
  );
}
