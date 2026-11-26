import { useEffect, useState } from 'react';
import * as api from '../api';
import type { GroupActions } from '../types';
import { useGroup } from '../useGroup';
import { useRates } from '../useRates';
import { errorMessage } from '../util';
import ShareBar from './ShareBar';
import Members from './Members';
import ExpenseForm from './ExpenseForm';
import Balances from './Balances';
import ExpenseList from './ExpenseList';
import GroupSettings from './GroupSettings';

type Props = {
  groupId: string;
  /** Called when the group loads or its name changes, so the group picker stays current. */
  onChanged: () => void;
  onDeleted: () => void;
};

export default function GroupView({ groupId, onChanged, onDeleted }: Props) {
  const { state, reload } = useGroup(groupId);
  const [error, setError] = useState<string | null>(null);
  const loadedName = state.status === 'ready' ? state.group.name : null;

  useEffect(() => {
    if (loadedName !== null) onChanged();
  }, [loadedName, onChanged]);

  if (state.status === 'loading') return <p className="muted center-text">Loading group…</p>;
  if (state.status === 'missing')
    return (
      <div className="card narrow">
        <h2>Group not found</h2>
        <p className="muted">This link may be wrong, or the group was deleted.</p>
        <a href="#/new">Start a new group</a>
      </div>
    );
  if (state.status === 'error') return <div className="card narrow error">{state.message}</div>;

  const group = state.group;
  const run = async (fn: () => Promise<unknown>) => {
    try {
      setError(null);
      await fn();
      await reload();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    }
  };

  const actions: GroupActions = {
    addMember: (name) => run(() => api.addMember(group.id, name)),
    removeMember: (id) => run(() => api.removeMember(id)),
    addExpense: (e) => run(() => api.addExpense(group.id, e)),
    deleteExpense: (id) => run(() => api.deleteExpense(id)),
    rename: (name) => run(() => api.updateGroup(group.id, { name })),
    setBaseCurrency: (code) => run(() => api.updateGroup(group.id, { base_currency: code })),
    deleteGroup: async () => {
      try {
        await api.deleteGroup(group.id);
        onDeleted();
        return true;
      } catch (e) {
        setError(errorMessage(e));
        return false;
      }
    },
  };

  return (
    <>
      <ShareBar group={group} />
      {error && (
        <div className="banner error" role="alert">
          <span>{error}</span>
          <button className="icon" aria-label="Dismiss" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}
      <GroupBody group={group} actions={actions} />
    </>
  );
}

function GroupBody({ group, actions }: { group: import('../types').Group; actions: GroupActions }) {
  const rates = useRates(group.baseCurrency);
  return (
    <div className="grid">
      <div className="col">
        <Members group={group} actions={actions} />
        <ExpenseForm group={group} rates={rates} actions={actions} />
      </div>
      <div className="col">
        <Balances group={group} actions={actions} />
        <ExpenseList group={group} actions={actions} />
        <GroupSettings group={group} actions={actions} />
      </div>
    </div>
  );
}
