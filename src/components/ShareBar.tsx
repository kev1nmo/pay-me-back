import { useState } from 'react';
import type { Group } from '../types';
import { groupLink } from '../util';

export default function ShareBar({ group }: { group: Group }) {
  const [copied, setCopied] = useState(false);
  const link = groupLink(group.id);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: group.name, text: `Add your expenses for ${group.name}`, url: link });
        return;
      } catch {
        // cancelled or unsupported: fall through to copy
      }
    }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="share-bar">
      <div className="grow">
        <h2>{group.name}</h2>
        <small className="muted">
          {group.members.length} {group.members.length === 1 ? 'person' : 'people'} · settles in {group.baseCurrency} ·
          updates live
        </small>
      </div>
      <button onClick={share}>{copied ? 'Link copied ✓' : 'Invite friends'}</button>
    </section>
  );
}
