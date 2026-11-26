# Pay Me Back

Split expenses between friends in any currency. Runs entirely in the browser: no accounts, no server.

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # split / settle-up logic tests
npm run build    # static site in dist/ — host anywhere (Netlify, GitHub Pages, Vercel…)
```

## How it works
- **Groups** each have a *settle-up currency*. Everyone's balance is shown in it.
- **Expenses**: who paid, how much, in which currency, and who shares it (split equally).
- **Exchange rates** come from [open.er-api.com](https://www.exchangerate-api.com) (free, no key, updated daily, cached 6h).
  The rate is **frozen on each expense** when it's added, so balances don't drift as rates change. You can override it
  (for example, to match the rate your card actually charged), and you can type it in by hand when you're offline.
- **Settle up** finds a short list of payments that zeroes everyone out. "Mark paid" records a repayment.
- Money math is done in integer minor units (cents, yen…), so balances always sum to exactly zero.
- Data is saved in `localStorage` on this device only.

## Code map
- `src/money.ts`: splitting, balances, settle-up (pure, tested in `money.test.ts`)
- `src/rates.ts`: rate fetching + caching
- `src/components/`: UI
