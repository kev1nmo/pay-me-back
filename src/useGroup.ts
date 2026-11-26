import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchGroup, joinGroup, subscribeToGroup } from './api';
import type { Group } from './types';
import { errorMessage } from './util';

export type GroupState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error'; message: string }
  | { status: 'ready'; group: Group };

/** Joins, loads, and live-syncs a group. */
export function useGroup(id: string) {
  const [state, setState] = useState<GroupState>({ status: 'loading' });
  const currentId = useRef(id);
  const groupRef = useRef<Group | null>(null);

  const reload = useCallback(async () => {
    try {
      const g = await fetchGroup(id);
      if (currentId.current !== id) return;
      groupRef.current = g;
      setState(g ? { status: 'ready', group: g } : { status: 'missing' });
    } catch (e) {
      if (currentId.current !== id) return;
      // Keep showing the last good data if a background refresh fails.
      setState((s) => (s.status === 'ready' ? s : { status: 'error', message: errorMessage(e) }));
    }
  }, [id]);

  useEffect(() => {
    currentId.current = id;
    groupRef.current = null;
    setState({ status: 'loading' });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleReload = () => {
      clearTimeout(timer);
      timer = setTimeout(reload, 150);
    };

    joinGroup(id)
      .then((found) => {
        if (currentId.current !== id) return;
        if (found) reload();
        else setState({ status: 'missing' });
      })
      .catch((e) => currentId.current === id && setState({ status: 'error', message: errorMessage(e) }));

    const unsubscribe = subscribeToGroup(id, ({ eventType, oldId }) => {
      if (eventType === 'DELETE') {
        const g = groupRef.current;
        const ours =
          !!g && (oldId === g.id || g.members.some((m) => m.id === oldId) || g.expenses.some((x) => x.id === oldId));
        if (!ours) return;
      }
      scheduleReload();
    });

    // Catch up on anything missed while the tab was in the background.
    const onVisible = () => document.visibilityState === 'visible' && scheduleReload();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearTimeout(timer);
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [id, reload]);

  return { state, reload };
}
