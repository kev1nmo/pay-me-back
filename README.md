# Pay Me Back

Split expenses between friends in any currency. Share a group's link and everyone can add expenses at the same time.
The page updates live.

**Live:** https://kev1nmo.github.io/pay-me-back/

## How it works
- **Groups** each have a *settle-up currency*. Everyone's balance is shown in it.
- **Sharing:** each group has a link (`#/g/<id>`). Anyone who opens it can view and add expenses. There are no
  accounts: each browser gets an anonymous Supabase login, and opening a link grants that browser access to the group.
  Groups can't be listed or browsed without their link.
- **Live sync:** Supabase Realtime pushes changes to everyone viewing the group.
- **Exchange rates** come from [open.er-api.com](https://www.exchangerate-api.com) (free, no key, updated daily).
  The rate is **frozen on each expense** when it's added, so balances don't drift. You can override it (for example,
  to match the rate your card charged).
- **Settle up** finds a short list of payments that zeroes everyone out. "Mark paid" records a repayment.
- Money math uses integer minor units (cents, yen…), so balances always sum to exactly zero.

## Setup
1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**: paste [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   Then do the same with [`supabase/migrations/002_auto_delete.sql`](supabase/migrations/002_auto_delete.sql)
   (deletes groups after 6 months with no activity, checked daily by `pg_cron`).
3. **Authentication → Sign In / Providers**: turn on **Allow anonymous sign-ins**.
4. Copy `.env.example` to `.env.local` and fill in the Project URL and publishable key
   (**Project Settings → API Keys**, or the **Connect** button).
5. For the GitHub Pages deploy, add the same two values as repository **variables**:
   `gh variable set VITE_SUPABASE_URL` and `gh variable set VITE_SUPABASE_PUBLISHABLE_KEY`.

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # split / settle-up logic tests
npm run build
```

Free Supabase projects pause after a week with no activity. Unpause them from the dashboard.

## Code map
- `supabase/schema.sql`: tables, row-level security, integrity triggers, `create_group` / `join_group`
- `src/api.ts`: all database reads and writes, plus the realtime subscription
- `src/useGroup.ts`: joins, loads, and live-syncs a group
- `src/money.ts`: splitting, balances, settle-up (pure, tested in `money.test.ts`)
- `src/rates.ts`: exchange-rate fetching + caching
- `src/components/`: UI
