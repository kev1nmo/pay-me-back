import { useEffect, useState } from 'react';
import type { AppState, Group } from './types';
import { loadState, newId, saveState } from './storage';
import NewGroupForm from './components/NewGroupForm';
import GroupView from './components/GroupView';

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [creating, setCreating] = useState(false);

  useEffect(() => saveState(state), [state]);

  const group = state.groups.find((g) => g.id === state.activeGroupId) ?? null;
  const showCreate = creating || state.groups.length === 0;

  const updateGroup = (fn: (g: Group) => Group) =>
    setState((s) => ({ ...s, groups: s.groups.map((g) => (g.id === s.activeGroupId ? fn(g) : g)) }));

  const createGroup = (name: string, baseCurrency: string, memberNames: string[]) => {
    const g: Group = {
      id: newId(),
      name,
      baseCurrency,
      members: memberNames.map((n) => ({ id: newId(), name: n })),
      expenses: [],
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, groups: [...s.groups, g], activeGroupId: g.id }));
    setCreating(false);
  };

  const deleteGroup = () =>
    setState((s) => {
      const groups = s.groups.filter((g) => g.id !== s.activeGroupId);
      return { ...s, groups, activeGroupId: groups[0]?.id ?? null };
    });

  return (
    <div className="app">
      <header className="topbar">
        <h1>💸 Pay Me Back</h1>
        {state.groups.length > 0 && (
          <div className="group-picker">
            <select
              aria-label="Group"
              value={showCreate ? '' : (state.activeGroupId ?? '')}
              onChange={(e) => {
                setCreating(false);
                setState((s) => ({ ...s, activeGroupId: e.target.value }));
              }}
            >
              {showCreate && <option value="">New group…</option>}
              {state.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            {!showCreate && (
              <button className="secondary" onClick={() => setCreating(true)}>
                + New group
              </button>
            )}
          </div>
        )}
      </header>

      <main>
        {showCreate ? (
          <NewGroupForm
            onCreate={createGroup}
            onCancel={state.groups.length > 0 ? () => setCreating(false) : undefined}
          />
        ) : group ? (
          <GroupView group={group} updateGroup={updateGroup} onDelete={deleteGroup} />
        ) : null}
      </main>

      <footer>
        Data stays in this browser. <a href="https://www.exchangerate-api.com">Rates by Exchange Rate API</a>
      </footer>
    </div>
  );
}
