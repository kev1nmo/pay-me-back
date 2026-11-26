-- Pay Me Back database schema.
-- Run once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
--
-- Access model: every browser signs in anonymously. Opening a group's link calls join_group(),
-- which records that browser in group_access. Row-level security only lets a browser
-- read/write groups it has joined, so groups can't be listed or browsed by strangers.

-- ── Tables ──────────────────────────────────────────────────────────────────────────

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  base_currency text not null check (base_currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now()
);

create table public.group_access (
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_access_user_idx on public.group_access (user_id);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);
create unique index members_group_name_idx on public.members (group_id, lower(name));

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  description text not null check (char_length(trim(description)) between 1 and 200),
  amount numeric not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  rate numeric not null check (rate > 0), -- base-currency units per 1 unit of `currency`
  paid_by uuid not null references public.members,
  participants uuid[] not null check (cardinality(participants) > 0),
  date date not null,
  kind text not null default 'expense' check (kind in ('expense', 'payment')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index expenses_group_idx on public.expenses (group_id);

-- ── Access helper ───────────────────────────────────────────────────────────────────

create function public.has_group_access(gid uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.group_access a
    where a.group_id = gid and a.user_id = (select auth.uid())
  );
$$;

-- ── Row-level security ──────────────────────────────────────────────────────────────

alter table public.groups enable row level security;
alter table public.group_access enable row level security;
alter table public.members enable row level security;
alter table public.expenses enable row level security;

-- Groups are created through create_group() so the creator is granted access atomically.
create policy "groups: read joined" on public.groups
  for select to authenticated using (public.has_group_access(id));
create policy "groups: update joined" on public.groups
  for update to authenticated using (public.has_group_access(id)) with check (public.has_group_access(id));
create policy "groups: delete joined" on public.groups
  for delete to authenticated using (public.has_group_access(id));

-- Rows are added through join_group() / create_group().
create policy "access: read own" on public.group_access
  for select to authenticated using (user_id = (select auth.uid()));
create policy "access: leave" on public.group_access
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "members: joined groups" on public.members
  for all to authenticated
  using (public.has_group_access(group_id)) with check (public.has_group_access(group_id));

create policy "expenses: joined groups" on public.expenses
  for all to authenticated
  using (public.has_group_access(group_id)) with check (public.has_group_access(group_id));

-- ── Integrity triggers ──────────────────────────────────────────────────────────────

-- Payer and everyone in the split must belong to the expense's group.
create function public.check_expense_people() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not exists (select 1 from public.members m where m.id = new.paid_by and m.group_id = new.group_id) then
    raise exception 'The payer is not in this group';
  end if;
  if exists (
    select 1 from unnest(new.participants) p
    where not exists (select 1 from public.members m where m.id = p and m.group_id = new.group_id)
  ) then
    raise exception 'Everyone in the split must be in this group';
  end if;
  if cardinality(new.participants) <> (select count(distinct p) from unnest(new.participants) p) then
    raise exception 'Someone is listed twice in the split';
  end if;
  return new;
end;
$$;
create trigger expenses_check_people before insert or update on public.expenses
  for each row execute function public.check_expense_people();

-- Don't remove a person who is still part of an expense (unless the whole group is being deleted).
create function public.prevent_member_delete_in_use() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.groups g where g.id = old.group_id)
     and exists (
       select 1 from public.expenses e
       where e.group_id = old.group_id and (e.paid_by = old.id or old.id = any (e.participants))
     ) then
    raise exception '% is part of an expense. Delete those expenses first.', old.name;
  end if;
  return old;
end;
$$;
create trigger members_prevent_delete_in_use before delete on public.members
  for each row execute function public.prevent_member_delete_in_use();

-- Saved exchange rates are relative to the base currency, so lock it once expenses exist.
create function public.lock_base_currency() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.base_currency <> old.base_currency
     and exists (select 1 from public.expenses e where e.group_id = old.id) then
    raise exception 'You can''t change the settle-up currency once a group has expenses';
  end if;
  return new;
end;
$$;
create trigger groups_lock_base_currency before update on public.groups
  for each row execute function public.lock_base_currency();

-- ── RPCs ────────────────────────────────────────────────────────────────────────────

create function public.create_group(p_name text, p_base_currency text, p_members text[] default '{}')
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  gid uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  insert into public.groups (name, base_currency) values (trim(p_name), p_base_currency)
    returning id into gid;
  insert into public.group_access (group_id, user_id) values (gid, auth.uid());
  insert into public.members (group_id, name)
    select gid, n
    from (select distinct on (lower(trim(x))) trim(x) as n from unnest(p_members) as x) s
    where n <> '';
  return gid;
end;
$$;

-- Returns false if the group doesn't exist. Safe to call repeatedly.
create function public.join_group(p_group_id uuid) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if not exists (select 1 from public.groups where id = p_group_id) then
    return false;
  end if;
  insert into public.group_access (group_id, user_id) values (p_group_id, auth.uid())
    on conflict do nothing;
  return true;
end;
$$;

revoke execute on function public.create_group(text, text, text[]) from public, anon;
revoke execute on function public.join_group(uuid) from public, anon;
revoke execute on function public.has_group_access(uuid) from public, anon;
grant execute on function public.create_group(text, text, text[]) to authenticated;
grant execute on function public.join_group(uuid) to authenticated;
grant execute on function public.has_group_access(uuid) to authenticated;

-- ── Table privileges ────────────────────────────────────────────────────────────────
-- Newer Supabase projects don't expose new tables to the API automatically. Logged-in
-- (including anonymous) users get table access here; RLS above decides which rows.

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.groups, public.members, public.expenses to authenticated;
grant select, delete on public.group_access to authenticated;

-- ── Realtime ────────────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.groups, public.members, public.expenses;

-- ── Keep-alive ──────────────────────────────────────────────────────────────────────
-- Called every few days by .github/workflows/keep-alive.yml so the free project
-- doesn't pause from inactivity. Reads no data.

create function public.ping() returns boolean
language sql stable set search_path = ''
as $$ select true $$;

revoke execute on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
