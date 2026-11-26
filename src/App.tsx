import { useCallback, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { createGroup, ensureSession, listMyGroups } from './api';
import { isConfigured } from './supabase';
import type { GroupSummary } from './types';
import { errorMessage } from './util';
import NewGroupForm from './components/NewGroupForm';
import GroupView from './components/GroupView';

type Route = { page: 'home' } | { page: 'new' } | { page: 'group'; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseHash(hash: string): Route {
  if (hash === '#/new') return { page: 'new' };
  const m = hash.match(/^#\/g\/([^/?]+)/);
  if (m && UUID.test(m[1])) return { page: 'group', id: m[1].toLowerCase() };
  return { page: 'home' };
}

function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

const go = (hash: string) => {
  location.hash = hash;
};

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <div className="app">
      {isConfigured ? (
        <ConfiguredApp />
      ) : (
        <>
          <header className="topbar">
            <Brand />
          </header>
          <div className="card narrow">
            <h2>Database not configured</h2>
            <p className="muted">
              Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> (see README), then
              restart.
            </p>
          </div>
        </>
      )}
      <footer>
        {/* Attribution is required by the free exchange-rate API's terms. */}
        <a href="https://www.exchangerate-api.com">Rates by Exchange Rate API</a>
      </footer>
    </div>
    </MotionConfig>
  );
}

function Brand() {
  return (
    <a href="#/" className="brand">
      <span className="brand-mark">$</span>
      <span>
        Pay Me <span className="brand-accent">Back</span>
      </span>
    </a>
  );
}

const Spinner = () => (
  <div className="center-text">
    <span className="spinner" aria-label="Loading" />
  </div>
);

function ConfiguredApp() {
  const route = useRoute();
  const [session, setSession] = useState<'loading' | 'ready' | { error: string }>('loading');
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);

  const refreshGroups = useCallback(() => {
    listMyGroups().then(setGroups).catch(() => setGroups((g) => g ?? []));
  }, []);

  useEffect(() => {
    ensureSession()
      .then(() => {
        setSession('ready');
        refreshGroups();
      })
      .catch((e) => setSession({ error: errorMessage(e) }));
  }, [refreshGroups]);

  // Home: jump to your first group, or start a new one.
  useEffect(() => {
    if (route.page === 'home' && groups && groups.length > 0) location.replace(`#/g/${groups[0].id}`);
  }, [route, groups]);

  const handleCreate = async (name: string, base: string, members: string[]) => {
    const id = await createGroup(name, base, members);
    refreshGroups();
    go(`/g/${id}`);
  };

  const currentId = route.page === 'group' ? route.id : '';
  const pickerGroups = groups ?? [];

  let body: React.ReactNode;
  if (session === 'loading') body = <Spinner />;
  else if (session !== 'ready') body = <div className="card narrow error">{session.error}</div>;
  else if (route.page === 'group')
    body = (
      <GroupView
        key={route.id}
        groupId={route.id}
        onChanged={refreshGroups}
        onDeleted={() => {
          setGroups((gs) => gs?.filter((g) => g.id !== route.id) ?? null);
          refreshGroups();
          go('/');
        }}
      />
    );
  else if (route.page === 'new' || (groups && groups.length === 0))
    body = (
      <NewGroupForm
        onCreate={handleCreate}
        onCancel={pickerGroups.length > 0 ? () => history.back() : undefined}
      />
    );
  else body = <Spinner />;

  return (
    <>
      <header className="topbar">
        <Brand />
        {session === 'ready' && pickerGroups.length > 0 && (
          <div className="group-picker">
            <select aria-label="Your groups" value={currentId} onChange={(e) => go(`/g/${e.target.value}`)}>
              {!pickerGroups.some((g) => g.id === currentId) && <option value="">Choose a group…</option>}
              {pickerGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            {route.page !== 'new' && (
              <button className="secondary" onClick={() => go('/new')}>
                + New
              </button>
            )}
          </div>
        )}
      </header>
      <main>{body}</main>
    </>
  );
}
