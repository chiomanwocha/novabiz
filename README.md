# NovaBiz Merchant Dashboard

A small-merchant module for a fictional super-app, **FirstBank NovaPay**. Built as a take-home
assessment for a Frontend Engineer (ReactJS) role.

## What it is, and who it's for

NovaBiz gives a small merchant two things:

1. **A live view of money coming in** — balance, today's inflow/outflow, a searchable and
   filterable transaction feed (5,000 seeded transactions), and a small insights panel
   (top payer, busiest day, average sale, week-over-week trend).
2. **A safe way to send money out** — a 4-step flow (Recipient → Amount → Review → Confirm)
   that resolves and verifies the recipient's real name before anything is sent, and can't be
   double-submitted into two transfers.

The intended users are market traders, provision-store owners, and small online vendors — often
on low-end Android phones and patchy, expensive data. The UI is designed for that: no charts,
no animations, generous touch targets, and an offline banner rather than a blank screen when the
connection drops.

**There is no real backend.** Every `/api/*` call is intercepted in the browser by a mock
service worker (MSW) with a seeded in-memory database — see [Mock server & demo
data](#mock-server--demo-data) below.

## Running it

```bash
npm install && npm run dev
```

One command, works on a fresh clone. Opens at `http://localhost:5173`.

**Stack:** Vite + React 19 + TypeScript · TanStack Query v5 · react-hook-form + zod · Tailwind
CSS · `@tanstack/react-virtual` · MSW v2 · Vitest + React Testing Library · Playwright + axe ·
Storybook · `lucide-react`.

## Testing it

| Command             | What it runs                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck` | TypeScript, `strict` + `noUncheckedIndexedAccess`, no `any`                                                                                                         |
| `npm run lint`      | ESLint — `typescript-eslint` (type-aware), `react-hooks`, `jsx-a11y`, import-boundary rules, and banned patterns (`dangerouslySetInnerHTML`, `parseFloat` on money) |
| `npm run test`      | Vitest + React Testing Library — 360 unit/component tests                                                                                                           |
| `npm run test:e2e`  | Playwright, at 360×800 and 1440×900 — 16 specs, including `@axe-core/playwright` accessibility checks                                                               |
| `npm run build`     | Production build (`tsc -b && vite build`)                                                                                                                           |
| `npm run check`     | typecheck + lint + test, in that order                                                                                                                              |
| `npm run storybook` | Isolated playground for the key presentational components                                                                                                           |

Unit tests cover pure logic only (`lib/`, each feature's `logic/`) — money formatting/parsing,
the NUBAN check digit, the optimistic-update and reconciliation decision tables. Component tests
render against the **real mock server** (MSW's Node build), not stubbed fetches. E2E tests run a
real browser against the real dev build, and are the only layer that proves things like "a
double-click produces exactly one network request" or "the same `Idempotency-Key` is sent on
retry."

## Mock server & demo data

Every `/api/*` endpoint is faked with MSW, backed by a seeded PRNG (5,000 transactions over the
last 60 days, same on every run — no faker, fully reproducible).

**Mock controls** — a `failRate`, artificial `latency`, and `timeoutMode` can be set two ways,
and take effect instantly and app-wide (one shared in-memory object, read live by every handler):

- URL params: `/?failRate=1`, `/?timeoutMode=1`, `/?latency=3000`
- The "Mock controls" panel, bottom-right corner of every page

`failRate=1` is the setting to reach for in a demo — every simulated failure is a 500, which the
query retry policy (§ Resilience) silently retries up to 3 times, so anything less than 1
frequently gets absorbed before it's ever visible.

**Name-enquiry demo numbers** (any bank code, keyed off the account number's last 4 digits):

| Ends in               | Result                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `0000`                | 404 "Account not found"                                                                       |
| `1111`                | 422 "This account can't receive funds"                                                        |
| `2222`                | A hostile name (`<b>Ade</b><img src=x onerror=alert(1)>`) — proves it renders as literal text |
| `3333`                | A deliberately very long name — proves the 360px layout holds                                 |
| `9999`                | Delays past the client's request timeout — reaches the "timed out" UI state on demand         |
| fails the check digit | 400 "Invalid account number"                                                                  |
| anything else         | A deterministic seeded name (same input → same name, every time)                              |

## Folder structure & dependency rules

```
src/
  app/            App shell, routing, providers, the shared TanStack Query client
  config/         Cross-cutting constants (timeouts, page sizes, limits' fallbacks)
  lib/            Pure functions only — no React, no fetch. money, nuban, mask, idempotency
  api/            The one fetch wrapper (client.ts), typed errors, DTOs, per-endpoint modules
  mocks/          MSW handlers, in-memory db, seed data, dev controls
  shared/         ui/ (Button, Input, Card, …) and layout/ (AppShell, nav, theme toggle)
  features/
    dashboard/    BalanceSummary, TransactionFeed/Filters/Row, InsightsPanel
    send-money/   The 4-step flow: steps/, components/, hooks/, logic/
  theme/          CSS custom-property tokens
tests/e2e/        Playwright specs (root-level — Playwright's own convention)
```

One-way dependency direction, enforced by ESLint (`import/no-restricted-paths`), not just
convention:

```
pages → feature components → feature hooks → api/endpoints → api/client
                 ↘ shared/ui              ↘ lib (pure)
```

`lib/` imports nothing from the rest of the app. `shared/ui` knows nothing about any feature.
Features never import from each other — anything two need moves to `shared/`. Components never
call `fetch` directly.

Test files are colocated in a `__test__/` folder next to what they test (e.g.
`src/lib/__test__/money.test.ts`); Storybook stories sit directly next to their component
(`Button.tsx` + `Button.stories.tsx`).

## State and data-fetching

**TanStack Query v5** for all server state — caching, retry/backoff, optimistic updates,
`onlineManager`. No Redux/Zustand: there isn't enough client-only state to justify one: theme is
a small Context, everything else either comes from the server or lives in URL params (filters)
or local component state (form drafts).

**Vite + React + TypeScript**, not Next.js — the app sits behind a login, so SSR buys nothing,
and a one-command dev setup mattered more for a take-home than a framework's routing conventions.

## Money handling

Every amount is an integer number of **kobo** (1 Naira = 100 kobo), branded as a `Kobo` type so
a raw Naira `number` can't be passed where kobo is expected without going through an explicit
`toKobo()` assertion. Formatting divides by 100 exactly once, at display time, via
`Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" })`. User input is parsed with
`parseNairaToKobo`, which splits on the decimal point and adds the Naira/kobo parts as
**integers** — never `parseFloat(x) * 100`, which can silently drift (`parseFloat("1.13") * 100`
→ `112.99999999999999`). This ban is enforced by an ESLint rule scoped to `lib/money*` and
`features/send-money/**`, not just convention.

## Account number validation

Three layers, in order of trust:

1. **Format** — 10 digits.
2. **The CBN NUBAN check digit** (`lib/nuban.ts`) — a weighted checksum over the bank's 3-digit
   code and the account's 9-digit serial. Client-side, instant, and explicitly documented as **a
   typo catcher, not the authority** — it can't tell you an account exists, only that the number
   is well-formed for that bank. (Verified against two published worked examples; the primary
   CBN circular was not directly accessible, so the implementation is well-corroborated rather
   than primary-source-verified.)
3. **Name enquiry** — the real source of truth. `POST /api/name-enquiry` resolves an actual
   name, which the merchant sees and confirms before Next is enabled. Editing the account number
   afterward clears the resolved name immediately (it's derived from the query key, not left to
   effect timing). The resolved name is untrusted, rendered as text only — never
   `dangerouslySetInnerHTML`.

The transfer endpoint re-validates everything server-side regardless of what the client already
checked, including that the `nameEnquiryRef` is for the same account/bank and less than 10
minutes old.

## Send Money reconciliation (including timeouts)

A single idempotency key (`crypto.randomUUID()`) is created once per attempt and sent as the
`Idempotency-Key` header. The server only ever saves a result under that key if the transfer was
genuinely _applied_ — never for a validation failure or a simulated failure — so a "Try again"
with the same key can safely retry a failure, and safely replay (without double-debiting) a
success whose response the client never actually saw.

On `onMutate`, the balance and feed update **optimistically**: subtract the amount, add a
`pending` row. On failure or timeout, `reconcile()` (a pure decision function, fully unit
tested) decides what happens next:

| What happened                                                   | Action                                                                             |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| A definite server rejection (4xx/5xx)                           | Restore the snapshot, show the server's message                                    |
| Timeout/network error, but a status check confirms it succeeded | Keep the optimistic state — it was right                                           |
| Timeout/network error, status check confirms failure or 404     | Restore the snapshot                                                               |
| Timeout/network error, and even the status check fails          | Restore, but mark "Unconfirmed" — the outgoing refetch is what actually settles it |

The timeout path checks server status _before_ deciding, because a timeout only means the client
gave up waiting — the server may well have applied the transfer already. `onSettled` always
invalidates and refetches, so the server is the final word regardless of which branch ran.

## Accessibility

- `jsx-a11y` lint rules plus `@axe-core/playwright` in e2e — no serious/critical violations.
- Every input has a real `<label>`, errors linked via `aria-describedby`/`aria-invalid`.
- Live-region announcements for async state; focus management on every Send Money step change.
- Status is never colour alone — every badge pairs colour with text.
- The whole flow is keyboard-operable, proven by a dedicated keyboard-only e2e spec.

## Resilience

- Query retry: up to 3 attempts for retryable errors (`network`, `timeout`, or any `5xx` — never
  a `4xx`), with 1s/2s/4s/8s-capped backoff.
- An offline banner reads TanStack Query's own `onlineManager`, so "offline" is exactly the
  signal already pausing every query/mutation — never a second source of truth.
- Every fetching view has explicit loading, empty, and error (with Retry) states — never raw
  error text.
- A long-idle or backgrounded tab can lose the service worker's control of the page (the same
  thing a hard reload causes); the client detects this and silently self-heals with one reload
  attempt before ever surfacing an error.

## Trade-offs

| Decision                                                                       | Trade-off accepted                                                                                                                                                                                  |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Only the unfiltered dashboard tab gets the optimistic pending row              | A merchant viewing a _filtered_ tab mid-send won't see it until the next refetch (a few hundred ms later) — reimplementing the server's filter matching client-side wasn't worth it for that window |
| A search box exists alongside the virtualised feed                             | Virtualisation removes off-screen rows from the DOM, which breaks the browser's own Ctrl/Cmd+F — the search box is a deliberate replacement, not a missing feature                                  |
| `tseslint.configs.strictTypeChecked` over the non-type-checked `strict` config | Slower lint runs (builds TS project info), in exchange for catching floating-promise bugs in the mutation handlers                                                                                  |
| `eslint`/`@eslint/js` pinned to `^9` rather than `^10`                         | `eslint-plugin-jsx-a11y` didn't declare ESLint 10 peer support at time of writing                                                                                                                   |
| No code-splitting configured yet                                               | Production build has one >500kB JS chunk; acceptable for a take-home, flagged rather than fixed under time pressure                                                                                 |

## Assumptions

- Seed data numbers (merchant starting balance ₦314,500.75, transaction amount tiers
  ₦200–150,000, status mix 85% successful/10% failed/5% pending, type mix 55% credit/45% debit,
  single-transfer limit ₦5,000, daily limit ₦20,000) are judgment calls picked to look plausible
  for the described personas and to leave headroom for a live demo send — not sourced from the
  brief.
- Daily send-limit usage is a fixed seed value (₦3,000), not derived from the transaction
  history.
- The brand mark is a placeholder monogram, not the real FirstBank logo.
- The `warning` token colour has no placeholder in the brief the way primary/accent/success/
  danger do, so it isn't logo-derived.

## What's next

- Swap the placeholder brand mark for the real FirstBank asset once available.
- Add code-splitting to bring the production JS chunk under the 500kB warning threshold.
- `suggestBanks` can legitimately return more than one bank for the same account number (~10%
  collision chance on the check digit alone) — worth surfacing more clearly in the UI rather
  than just documented as expected behaviour.
