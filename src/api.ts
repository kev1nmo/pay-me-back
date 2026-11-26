import { supabase } from './supabase';
import type { Expense, Group, GroupSummary, NewExpense } from './types';

type GroupRow = { id: string; name: string; base_currency: string; created_at: string };
type MemberRow = { id: string; name: string };
type ExpenseRow = {
  id: string;
  description: string;
  amount: number | string;
  currency: string;
  rate: number | string;
  paid_by: string;
  participants: string[];
  date: string;
  kind: 'expense' | 'payment';
};

type Result = { data: unknown; error: { message: string; code?: string } | null };

function check<T>(res: Result): T {
  if (res.error) {
    if (res.error.code === '23505') throw new Error('That name is already in the group.');
    throw new Error(res.error.message);
  }
  return res.data as T;
}

const toExpense = (r: ExpenseRow): Expense => ({
  id: r.id,
  description: r.description,
  amount: Number(r.amount),
  currency: r.currency,
  rate: Number(r.rate),
  paidBy: r.paid_by,
  participants: r.participants,
  date: r.date,
  kind: r.kind,
});

/** Every browser gets an anonymous Supabase user; it's what group access is tied to. */
export async function ensureSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw new Error(`Couldn't start a session: ${error.message}`);
}

export async function listMyGroups(): Promise<GroupSummary[]> {
  return check<GroupSummary[]>(await supabase.from('groups').select('id, name').order('created_at'));
}

export async function createGroup(name: string, baseCurrency: string, members: string[]): Promise<string> {
  return check<string>(
    await supabase.rpc('create_group', { p_name: name, p_base_currency: baseCurrency, p_members: members }),
  );
}

/** Gives this browser access to the group. Returns false if no such group exists. */
export async function joinGroup(id: string): Promise<boolean> {
  return check<boolean>(await supabase.rpc('join_group', { p_group_id: id }));
}

export async function fetchGroup(id: string): Promise<Group | null> {
  const [g, m, e] = await Promise.all([
    supabase.from('groups').select('id, name, base_currency, created_at').eq('id', id).maybeSingle(),
    supabase.from('members').select('id, name').eq('group_id', id).order('created_at'),
    supabase
      .from('expenses')
      .select('id, description, amount, currency, rate, paid_by, participants, date, kind')
      .eq('group_id', id)
      .order('created_at'),
  ]);
  const group = check<GroupRow | null>(g);
  if (!group) return null;
  return {
    id: group.id,
    name: group.name,
    baseCurrency: group.base_currency,
    createdAt: group.created_at,
    members: check<MemberRow[]>(m),
    expenses: check<ExpenseRow[]>(e).map(toExpense),
  };
}

export async function updateGroup(id: string, patch: { name?: string; base_currency?: string }) {
  check(await supabase.from('groups').update(patch).eq('id', id));
}

export async function deleteGroup(id: string) {
  check(await supabase.from('groups').delete().eq('id', id));
}

export async function addMember(groupId: string, name: string) {
  check(await supabase.from('members').insert({ group_id: groupId, name }));
}

export async function removeMember(id: string) {
  check(await supabase.from('members').delete().eq('id', id));
}

export async function addExpense(groupId: string, e: NewExpense) {
  check(
    await supabase.from('expenses').insert({
      group_id: groupId,
      description: e.description,
      amount: e.amount,
      currency: e.currency,
      rate: e.rate,
      paid_by: e.paidBy,
      participants: e.participants,
      date: e.date,
      kind: e.kind ?? 'expense',
    }),
  );
}

export async function deleteExpense(id: string) {
  check(await supabase.from('expenses').delete().eq('id', id));
}

export type ChangeEvent = { eventType: string; oldId?: string };

/** Calls onChange whenever anyone edits this group. Returns an unsubscribe function. */
export function subscribeToGroup(id: string, onChange: (ev: ChangeEvent) => void): () => void {
  const channel = supabase.channel(`group-${id}`);
  const handler = (p: { eventType: string; old: unknown }) =>
    onChange({ eventType: p.eventType, oldId: (p.old as { id?: string } | null)?.id });

  for (const [table, column] of [
    ['groups', 'id'],
    ['members', 'group_id'],
    ['expenses', 'group_id'],
  ] as const) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `${column}=eq.${id}` }, handler);
    // Supabase can't filter DELETE events, so listen to all and let the caller ignore unrelated ones.
    channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table }, handler);
  }
  channel.subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
