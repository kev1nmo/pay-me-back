-- Pay Me Back: automatically delete groups after 6 months with no activity.
-- Run once after schema.sql (Dashboard → SQL Editor → New query → paste → Run). Safe to re-run.
--
-- "Activity" = someone opens the group (join_group runs on every open) or adds/edits/removes
-- a person or expense. A daily job deletes any group with no activity for 6 months.

alter table public.groups
  add column if not exists last_activity_at timestamptz not null default now();

-- Mark a group active. Throttled to once an hour so opening a group doesn't spam
-- every other viewer with realtime updates.
create or replace function public.touch_group(gid uuid) returns void
language sql security definer set search_path = ''
as $$
  update public.groups set last_activity_at = now()
  where id = gid and last_activity_at < now() - interval '1 hour';
$$;
revoke execute on function public.touch_group(uuid) from public, anon, authenticated;

create or replace function public.touch_group_from_row() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.touch_group(coalesce(new.group_id, old.group_id));
  return null;
end;
$$;

drop trigger if exists members_touch_group on public.members;
create trigger members_touch_group after insert or update or delete on public.members
  for each row execute function public.touch_group_from_row();
drop trigger if exists expenses_touch_group on public.expenses;
create trigger expenses_touch_group after insert or update or delete on public.expenses
  for each row execute function public.touch_group_from_row();

-- Opening a group (which always calls join_group) counts as activity.
create or replace function public.join_group(p_group_id uuid) returns boolean
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
  perform public.touch_group(p_group_id);
  return true;
end;
$$;

-- Deletes groups inactive for 6 months; returns how many. Only the scheduled job can call it.
create or replace function public.delete_inactive_groups() returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  n integer;
begin
  delete from public.groups where last_activity_at < now() - interval '6 months';
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function public.delete_inactive_groups() from public, anon, authenticated;

-- Run it daily at 04:00 UTC. (Re-running this file updates the job instead of duplicating it.)
create extension if not exists pg_cron;
select cron.schedule('delete-inactive-groups', '0 4 * * *', 'select public.delete_inactive_groups()');
