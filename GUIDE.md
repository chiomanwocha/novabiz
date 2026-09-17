# GUIDE — how NovaBiz works, and how to defend it live

This is a self-contained study guide for the NovaBiz Merchant Dashboard: how to run it, every
way to test it, the algorithms behind the risky parts (money, account validation, send-money
reconciliation), and the mechanics behind the two error messages that show up during normal use.
Nothing here assumes you've read any other document — it's written to be read on its own, then
demoed from.

---

## 1. What this app actually is

A fictional small-merchant dashboard for FirstBank NovaPay. It has exactly two jobs:

1. **Show money coming in** — balance, today's inflow/outflow, a searchable/filterable
   transaction feed, and a small "insights" panel (top payer, busiest day, average sale,
   week-over-week).
2. **Let the merchant send money out**, safely — a 4-step flow (Recipient → Amount →
   Review → Confirm) with account-name verification before anything is sent, and a
   confirmation step that can't be double-clicked into two transfers.

There is **no real backend**. Every `/api/*` call is intercepted in the browser by a
service worker (MSW — Mock Service Worker) running fake handlers with an in-memory
database. This matters a lot for how testing and the "mock controls" work — see §5 and §7.

---

## 2. Running and testing it

```bash
npm install && npm run dev     # one command, fresh clone, opens http://localhost:5173
```

| Command             | What it checks                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck` | TypeScript `strict` + `noUncheckedIndexedAccess`, no `any`                                                           |
| `npm run lint`      | ESLint: react-hooks, jsx-a11y, import boundaries, banned patterns (`dangerouslySetInnerHTML`, `parseFloat` on money) |
| `npm run test`      | Vitest + React Testing Library — 360 unit/component tests                                                            |
| `npm run test:e2e`  | Playwright, at both 360×800 (mobile) and 1440×900 (desktop) — 16 specs, includes axe accessibility checks            |
| `npm run build`     | Production build (`tsc -b && vite build`)                                                                            |
| `npm run check`     | typecheck + lint + test, in that order — run this before saying anything is "done"                                   |
| `npm run storybook` | Isolated component playground for the presentational components                                                      |

**What each test layer is actually for**, since this is the part you're less familiar with:

- **Unit tests** (`lib/*.test.ts`, `logic/*.test.ts`) — pure functions, no React, no DOM.
  `formatKobo`, `parseNairaToKobo`, the NUBAN check digit, `reconcile`, `applyOptimisticTransfer`.
  These are the fastest and the most important: if the money math or the reconciliation
  decision table is wrong, everything built on top of it is wrong too.
- **Component tests** (`*.test.tsx` next to each component, in a `__test__` folder) — render
  a component with React Testing Library, interact with it the way a user would (`userEvent`,
  querying by role/label — never by CSS class or test-id), assert on what's visible. These
  run against the **real mock server** (MSW's Node build), not stubbed fetches — so a
  component test for `RecipientStep` genuinely exercises the name-enquiry handler.
- **E2E tests** (`tests/e2e/*.spec.ts`) — a real browser (Playwright), the real dev build,
  the real service worker. These prove things component tests can't: that a double-click
  really produces one network request, that the same `Idempotency-Key` header is sent on
  retry, that keyboard-only navigation reaches every control, that axe finds no serious
  accessibility violations.

**How to test the pending-transfer / failure / timeout scenarios by hand**, since these can't
happen by chance in normal use — you have to ask the mock server to simulate them (§5).

---

## 3. Mock controls — what they do, and why they can look "inconsistent"

`src/mocks/controls.ts` is a single in-memory object (`{ fixedLatencyMs, failRate, timeoutMode }`)
that every mock handler reads before responding. Two ways to set it:

- **URL params**, read once on load: `/?failRate=1`, `/?timeoutMode=1`, `/?latency=3000`
- **The "Mock controls" panel**, bottom-right corner of every page (`DevControls`) — same
  three knobs, live, no reload needed

**It genuinely is instant and app-wide.** `DevControls` is mounted exactly once, in `AppShell`,
which wraps every route — it is not a Dashboard-only or Send-Money-only thing. `mocks/controls.ts`
is one shared object; there's no per-page copy of it. Setting `failRate` to 1 while sitting on
Send Money and then switching to Dashboard doesn't need the setting to "travel" anywhere — it
was already global the instant you changed it.

**Why it can still _look_ inconsistent — the real reason:**

The controls only affect a request **the moment that request fires**. They don't retroactively
affect requests already in flight or already cached. Three specific traps:

1. **The bank list never asks again.** `useBanks` is set up with `staleTime: Infinity` (see
   §5.1) — after it loads once, it will never refetch for the rest of the session, no matter
   what `failRate` becomes afterward. If you set `failRate=1` and then reopen the bank
   dropdown expecting it to fail, it won't — it's not making a new request at all.
2. **Name-enquiry only fires when you type a new number.** Changing `failRate` while sitting
   still on the Recipient step does nothing _yet_ — nothing is asking the server anything. The
   setting is "waiting," not "not working."
3. **A moderate `failRate` gets silently absorbed by retries.** The shared query retry policy
   (`queryClient.ts`) retries up to 3 times on any retryable error, with 1s/2s/4s backoff. Every
   simulated failure in this app is a 500, which is retryable. At `failRate=0.5`, the chance all
   4 attempts (1 original + 3 retries) fail is `0.5⁴ = 6.25%` — so most of the time a `0.5`
   setting looks like it "isn't working" even though it's firing every time; the retry logic is
   just quietly winning. **`failRate=1` is the only setting guaranteed to be visible**, because
   no number of retries can turn a guaranteed failure into a success.

**How to demo each scenario reliably:**

| Want to show                      | Set                 | Then                                                                                                                                                                                                         |
| --------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A pending row in the feed         | `timeoutMode=1`     | Send a transfer — the server applies it for real but replies after your client's own timeout, so you see the optimistic "pending" row and then it resolves to "successful" once the status check confirms it |
| A rolled-back failed transfer     | `failRate=1`        | Send a transfer — guaranteed 500, balance and feed roll back exactly to what they were, error shown, "Try again" reuses the same key                                                                         |
| Dashboard loading/error states    | `failRate=1`        | Reload the dashboard — merchant/transactions/insights all fail and show Retry                                                                                                                                |
| Name-enquiry timeout specifically | (no control needed) | Type an account number ending in `9999` — this is hard-coded to always delay past the timeout, regardless of `failRate`                                                                                      |

---

## 4. Money — kobo, never floats (`src/lib/money.ts`)

**Every amount, everywhere from API → state → props, is an integer number of kobo** (1 Naira =
100 kobo). No Naira value is ever a plain `number` that arithmetic could touch — it's branded:

```ts
export type Kobo = number & { readonly __brand: unique symbol }
```

This is a **phantom type**: at runtime it's just a number, but TypeScript won't let you pass a
raw `number` where a `Kobo` is expected without going through `toKobo()`, which asserts
`Number.isSafeInteger`. This catches a whole category of bug at compile time: accidentally
passing a Naira float into something expecting kobo.

**Formatting (`formatKobo`)** — division by 100 happens **exactly once**, at display time:

```ts
const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
formatKobo(kobo) // => currencyFormatter.format(kobo / 100)
```

`100050` kobo → `₦1,000.50`. `Intl.NumberFormat` handles rounding and grouping correctly — you
never do your own string-splicing or manual comma-insertion for money output.

**Parsing user input (`parseNairaToKobo`)** — this is the one the brief specifically warns
about, because the naive approach is wrong:

```ts
// WRONG — never do this:
parseFloat('1.13') * 100 // === 112.99999999999999, not 113
```

Floating-point numbers can't represent most decimal fractions exactly, so multiplying by 100
after the fact can drift. Instead:

```ts
const NAIRA_INPUT_PATTERN = /^\d{1,12}(\.\d{1,2})?$/ // at most 2 decimal places

export function parseNairaToKobo(input: string): Kobo | null {
  const cleaned = input.replace(/[,\s]/g, '') // strip "1,000.50" -> "1000.50"
  if (!NAIRA_INPUT_PATTERN.test(cleaned)) return null
  const [nairaPart = '', koboPart = ''] = cleaned.split('.')
  const kobo = Number(nairaPart) * 100 + Number(koboPart.padEnd(2, '0'))
  return toKobo(kobo)
}
```

Splitting on the decimal point and treating each side as an **integer** (padding the kobo part
to 2 digits, e.g. `"5"` → `"50"`) means every operation is exact integer arithmetic — no
floating-point multiplication ever touches the value. `"1,000.5"` → `100050`. Invalid input
(`"1.234"`, `"abc"`, `""`, `"-5"`) returns `null`, and the caller (a zod schema, §8) turns that
into a field error.

ESLint enforces this isn't accidentally reintroduced: `parseFloat`/`Number.parseFloat` are
banned by lint rule inside `src/lib/money*` and `src/features/send-money/**`.

---

## 5. Account number validation — the NUBAN check digit (`src/lib/nuban.ts`)

This is flagged as high-risk in the brief because a wrong implementation here means money could
silently validate against the wrong account. Three layers of defense, in order:

**Layer 1 — format.** `isNubanFormat` just checks 10 digits. Catches "I typed 9 digits."

**Layer 2 — the CBN check-digit algorithm (client-side, instant, typo-catcher only).**
Nigeria's NUBAN scheme has each bank's 3-digit CBN code prefixed with `"000"` to make a
6-digit institution code, which combines with the account's 9-digit serial into a 15-digit
sequence. Each of those 15 digits is multiplied by a fixed weight and summed; the check digit
is whatever makes the total a multiple of 10:

```ts
const NUBAN_WEIGHTS = [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3] as const

function computeCheckDigit(bankCode: string, serial: string): number {
  const digits = `000${bankCode}${serial}`.split('').map(Number)
  const sum = digits.reduce((total, digit, i) => total + digit * NUBAN_WEIGHTS[i], 0)
  return (10 - (sum % 10)) % 10
}
```

Verified against two published worked examples before it was trusted:
`bank 011, serial 000001457 → check digit 9 → account 0000014579`
`bank 058, serial 001656322 → check digit 8 → account 0016563228`

**Honest caveat, worth saying out loud if asked:** the algorithm was sourced from a write-up of
the CBN scheme, cross-checked against a second independent implementation, and both worked
examples pass — but the primary CBN regulatory circular itself wasn't directly accessible to
verify against. Treat it as well-corroborated, not primary-source-guaranteed. This is exactly
why it's positioned as a **typo catcher, not the authority** (see Layer 3).

One real, tested, non-bug consequence: `suggestBanks` can return **more than one** bank for
the same account number, because the check digit is a single mod-10 value — a roughly 10%
chance of collision with an unrelated bank. If a demo ever shows two banks matching the same
number, that's the algorithm working correctly, not broken.

**Layer 3 — name enquiry (the real source of truth).** The check digit only proves the number
_could_ be valid for that bank; it says nothing about whether the account exists or whose it
is. `POST /api/name-enquiry` is what actually resolves a name, and the transfer endpoint
re-validates everything server-side regardless of what the client already checked — the client
check is purely a fast, no-network way to catch an obvious typo before spending a round trip.

**Demo numbers** (any bank, last 4 digits of a valid-check-digit 10-digit number):

| Ends in               | Result                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0000`                | 404 "Account not found"                                                                                                                                        |
| `1111`                | 422 "This account can't receive funds"                                                                                                                         |
| `2222`                | Hostile name: `<b>Ade</b><img src=x onerror=alert(1)>` — renders as literal text, proves no `dangerouslySetInnerHTML` anywhere in the render path              |
| `3333`                | A deliberately very long name, for checking the 360px layout doesn't break                                                                                     |
| `9999`                | Delays past the client's own request timeout (10s) — this is what makes the "checking account… / timed out" states reachable on demand, no mock-control needed |
| fails the check digit | 400 "Invalid account number"                                                                                                                                   |
| anything else         | A deterministic seeded name — same account number always resolves to the same name, so a demo is repeatable                                                    |

`saveNameEnquiry` records the account/bank/timestamp under the returned `nameEnquiryRef`. A
transfer must carry a `nameEnquiryRef` that (a) matches the same account+bank and (b) is less
than **10 minutes** old (`NAME_ENQUIRY_VALID_MS`), or the server rejects it with 422 "Please
confirm the recipient again" — this stops a stale/reused enquiry from a different account being
smuggled into a transfer.

**Editing the account number after a name resolves clears the name immediately** — this is
built into `useNameEnquiry`'s query key (`['nameEnquiry', bankCode, accountNumber]`), not left
to a `useEffect` racing a render. The moment either value changes, React Query simply has no
cached result for the new key — there's no stale name that could flash on screen, and no way for
an in-flight response for an _old_ number to land on top of a number you've since edited to.

---

## 6. Send Money — the whole lifecycle

### 6.1 The four steps, and why they stay four

Recipient → Amount → Review → Confirm. Recipient resolves and locks in a real name (§5).
Amount validates against balance and limits (§6.2) with a live-formatted input (commas appear
as you type, via `amountInputFormat.ts` — display-only, `parseNairaToKobo` is still what
actually turns it into kobo). Review creates the **idempotency key** for this attempt and shows
the plain recap. Confirm is the deliberately distinct final gate — a direct question
("Send ₦X to Y?"), the masked bank/account line, and the one fact Review doesn't say:
**this can't be undone once it's sent.** Going back and changing the recipient or amount
generates a brand-new idempotency key — the old attempt is abandoned, not resumed.

### 6.2 Amount validation, in order

`createAmountSchema` (zod) checks, most-fundamental-first, so only the single most relevant
error ever shows at once: is it a real positive amount → does it exceed the current balance →
does it exceed the merchant's **single-transfer limit** → does it exceed the **remaining daily
limit** (`dailyLimitKobo - usedTodayKobo`). Nothing here is hard-coded — every limit comes from
`GET /api/merchant`. Validation runs on blur and on pressing Next, not on every keystroke
(cheaper on the low-end phones this app is designed for).

### 6.3 The idempotency key — what actually stops a double-send

`createIdempotencyKey()` is just `crypto.randomUUID()`, generated once when Review is reached
and sent as the `Idempotency-Key` header on `POST /api/transfers`. The **server**, not the
client, is what makes this safe: `mocks/handlers/transfers.ts` only ever saves a
`TransferRecord` under a key when the transfer was genuinely _applied_ (succeeded, or applied
under `timeoutMode`) — never for a validation failure or a simulated failure. So:

- Same key, transfer was previously applied → the stored result is replayed, **nothing is
  debited again**.
- Same key, previous attempt never actually applied (it was a validation error or a simulated 500) → nothing was saved, so a retry with the same key runs the real logic fresh.

This is also why the `ConfirmStep` Send button disables itself on the first press, and why a
double-click in the e2e suite is asserted to produce **exactly one** POST — the button
disabling is the first line of defense, the idempotency key is the one that would still save
you even if a rapid double-click somehow got both requests out the door.

### 6.4 Optimistic update, and undoing it exactly

`onMutate` (in `useSendMoney.ts`):

1. Cancels in-flight merchant/transaction queries (so a race can't clobber the optimistic write).
2. **Snapshots** both caches, untouched.
3. Calls `applyOptimisticTransfer`: subtracts the amount from the balance, adds it to today's
   outflow, and **prepends a `pending` row** to the transaction feed with a temp id
   (`optimistic-<idempotencyKey>`).

`applyOptimisticTransfer` never mutates its inputs — every object it returns is new. That single
fact is what makes `restoreSnapshot` trivially correct: it just hands back the exact snapshot
object taken before the optimistic write, which is still perfectly valid because nothing
upstream of it was ever touched in place.

Only the **unfiltered** dashboard view gets the optimistic pending row — a merchant viewing a
_filtered_ tab mid-send won't see it until the transaction list is invalidated moments later.
Reimplementing the server's filter-matching purely to prepend correctly into every possible
filter combination wasn't worth it for a window that's only ever a few hundred milliseconds
wide — a deliberate, logged trade-off, not an oversight.

### 6.5 Reconciliation — what happens when the mutation itself fails or times out

This is the part CLAUDE.md calls out explicitly, because it's easy to get wrong: **success
handling inside a `data?.code === 200` check is fine for reads, but rollback has to live in the
mutation's `onError`/`onSettled`**, because a thrown error or a timeout never reaches a
`code === 200` branch at all.

`onError` turns whatever actually happened into one of five cases, decided by the pure
function `reconcile()` (`logic/reconcile.ts`) — this is the exact decision table, worth
knowing branch-for-branch:

| What happened                                                                          | `reconcile` input                           | Action                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A definite server rejection (any real 4xx/5xx response to the transfer itself)         | `http`                                      | **Always restore** the snapshot, show the server's message                                                                                                                                               |
| Timeout/network error, but `GET /api/transfers/:key` confirms it actually went through | `statusConfirmedSuccess`                    | **Keep** the optimistic state — it was right all along, no rollback                                                                                                                                      |
| Timeout/network error, and the status check says it failed or 404s                     | `statusConfirmedFailure` / `statusNotFound` | **Restore** — nothing was actually applied                                                                                                                                                               |
| Timeout/network error, and even the _status check itself_ fails                        | `statusCheckFailed`                         | **Restore**, but mark the attempt "Unconfirmed" rather than "Failed" — the truth is genuinely unknown right now, and the outgoing `onSettled` refetch (not a guess here) is what will actually settle it |

Why the timeout path checks server status **before** deciding, rather than just always
restoring: a timeout only means "the client gave up waiting," not "the server didn't do it."
`mocks/handlers/transfers.ts`'s `timeoutMode` simulates exactly this — the server applies the
transfer for real, saves the record, and _then_ replies after the client's own timeout window
has already elapsed. Restoring the snapshot in that case would show the merchant a balance that
doesn't match what the server actually did — reconciliation exists specifically to prevent that
mismatch, not just to be cautious.

`onSettled` always invalidates and refetches merchant + transactions, regardless of which
branch ran — server truth is the final word no matter what the optimistic/reconciled state
already showed.

**Retry policy on the mutation itself:** automatic retry only for a genuine `network` error
(never `timeout`, never `http`/4xx/5xx), max 2 attempts, 1s→2s→4s-capped backoff. This is safe
specifically because of the idempotency key — a retried request can never double-debit even if
it does eventually reach the server. A user-pressed "Try again" re-sends with the **same** key
for the same reason.

---

## 7. Errors and resilience — the two messages you keep asking about

### 7.1 "We couldn't load this right now. Please try again." / "Reloading the page usually fixes this."

**The concrete, reproducible test case — do this yourself, right now, to see it on demand:**

1. Open DevTools → **Application** tab → **Service Workers**
2. Click **Unregister** next to the MSW worker
3. Click anything that triggers a request — Retry on any card, or switch between
   Dashboard/Send Money

You'll get the exact same message every time, because you've just manually created the one
condition that causes it.

**Why this happens at all, in plain terms:** every `/api/*` call is only "real" because a
service worker is intercepting it. If the page ever stops being _controlled_ by that worker —
which happens on a genuine hard reload, and which Chrome can also do on its own to a
backgrounded tab it decides to discard for memory (this is what "I didn't do anything, I was
on another page" actually was — Chrome silently reloaded the tab) — then any `/api/*` fetch
skips the worker entirely and hits Vite's real dev server instead. Vite doesn't know what
`/api/merchant` is, so it serves its SPA fallback: `index.html`, at a real HTTP 200. That's a
technically-successful-looking response that isn't the JSON envelope every real handler always
returns.

`api/client.ts` detects this the only way it can — the body isn't valid JSON — and, before ever
showing an error, tries a **silent self-heal first**: if the page is genuinely uncontrolled and
hasn't already tried this once this session, it reloads automatically (`window.location.reload()`).
A `sessionStorage` guard (`novabiz-msw-reload-guard`) stops that from looping forever if a
browser genuinely never re-establishes control. The message only ever shows up when that silent
recovery has already been tried and the page is still stuck — a deliberately rare, honestly
worded last resort, not the norm.

**One real bug found and fixed in this app's history, worth knowing:** the guard used to only
ever get cleared by `main.tsx` at the next full page boot — never by an ordinary successful
request mid-session. That meant the _first_ lapse in a tab's life would self-heal correctly,
but every lapse _after_ that, in the same tab, would skip straight to the visible error, because
the guard was still sitting at `'1'` from the first recovery. Fixed by clearing the guard the
moment any request succeeds normally (`api/client.ts`, right before returning the response) —
so every lapse gets its own fresh silent-recovery attempt, not just the first one.

**`ErrorFallback`/`ErrorBoundary`/`RouteErrorFallback`** are the separate, unrelated last line
of defense for a genuine **render crash** (a component throwing during render) rather than a
failed request — React's own `componentDidCatch` catches anything above the router, React
Router's `errorElement` catches anything thrown inside a routed page. Both funnel into the same
calm "Something went wrong / Reloading the page usually fixes this" UI with a Reload button,
because a crashed render tree genuinely can't safely retry in place.

### 7.2 The general resilience policy

- **Query retry** (`queryClient.ts`): retry up to 3 times, only for `isRetryable` errors
  (`network`, `timeout`, or any `http` ≥ 500 — never a 4xx), 1s→2s→4s→8s-capped backoff.
- **`OfflineBanner`**: reads `TanStack Query`'s own `onlineManager` (via `useOnlineStatus`,
  wrapping `useSyncExternalStore`) rather than a separate `navigator.onLine` listener — so
  "offline" here is exactly the same signal that already pauses every query/mutation, never a
  second source of truth that could disagree with it. Message: "You're offline — we'll retry
  when you're back. No data? Dial *894#."
- **Every fetching view** has an explicit loading, empty, and error (with Retry) state — never
  a raw error message; every `ApiError` carries a calm, human-facing `message` instead.

---

## 8. Accessibility — what's actually enforced, not just intended

- `jsx-a11y` lint rules, plus axe (`@axe-core/playwright`) run in e2e against both the
  dashboard and the recipient step, asserting no serious/critical violations.
- Every input has a real `<label>`; errors are linked via `aria-describedby` and
  `aria-invalid`.
- A single `StatusAnnouncer` (`aria-live="polite"`) carries async status through the send flow;
  failures additionally use `role="alert"`. Where a status would otherwise visually duplicate a
  heading already on screen (the "Transfer sent!" heading plus the aria-live text), the
  announcer gets a `visuallyHidden` prop — the screen-reader announcement still fires, a sighted
  user just doesn't see the same sentence twice.
- Focus moves to the step heading (`tabIndex={-1}`) on every Send Money step change, so a
  screen-reader user always lands somewhere meaningful, not stuck on a button that just
  disappeared.
- Status is never shown by colour alone — every status badge pairs colour with text.
- The whole flow is operable with Tab, Shift+Tab, Enter, and Space only — proven by a dedicated
  keyboard-only e2e spec, not just assumed.

---

## 9. Dashboard feed — the performance and search trade-off

5,000 seeded transactions, loaded via `useInfiniteQuery` (pages of 50), rendered through
`@tanstack/react-virtual` so only the rows actually on screen exist in the DOM regardless of
how many pages have loaded. **The search box exists specifically because the browser's own
Ctrl/Cmd+F can't see virtualised rows that have scrolled out of the DOM** — that's a deliberate,
logged trade-off of virtualising at all, not a missing feature. Filters (date range, status,
type) and search live in URL params (never personal data) and changing any of them resets the
list from page 1.

**The date-range bug that was fixed, worth knowing the shape of:** picking a single day (from
and to both that day) used to show nothing, while a two-day range ending on that day did show
results. The handler was parsing `"YYYY-MM-DD"` with `new Date(string)`, which JavaScript treats
as **UTC midnight** — but the date picker builds that string from the browser's **local**
calendar day. In a timezone behind UTC, "today" locally can still be "yesterday" in UTC at that
instant, so the filter's UTC-midnight boundary didn't actually cover the local day the user
picked. Fixed by parsing the date string into explicit local-time boundaries
(`new Date(year, month-1, day, ...)` for both the start and end of that local day) instead of
letting `Date` guess UTC.

---

## 10. Dark mode and theming

Defaults to the stored preference (`localStorage['novabiz-theme']`, wrapped in try/catch), then
falls back to `prefers-color-scheme`. An inline script in `index.html` sets `data-theme` before
first paint using the same key, so there's no flash of the wrong theme on load — the
`ThemeProvider` only re-applies it on toggle afterward, it doesn't fight that initial value.
**This is the only thing this app ever puts in localStorage** — mock controls are deliberately
kept in-memory only, never persisted, so a stale simulated-failure setting can never silently
survive a page reload and confuse a demo.

---

## 11. Folder structure and the one-way dependency rule

```
pages → feature components → feature hooks → api/endpoints → api/client
                 ↘ shared/ui              ↘ lib (pure, no React, no fetch)
```

- `lib/` imports nothing from the rest of the app — pure functions, each with its own test file.
- `shared/ui` knows nothing about any feature.
- Features never import from each other directly; anything two features need moves to `shared/`.
- Components never call `fetch` directly — only hooks do, and only through `api/endpoints/*`,
  which goes through the single `api/client.ts`.
- This is enforced by `import/no-restricted-paths` in ESLint, not just convention — the build
  fails if the direction is violated.

---

## 12. A quick self-test — can you explain these without looking?

- Why is money always an integer, and why kobo specifically instead of Naira?
- Walk through `parseNairaToKobo("1,000.50")` step by step — why does it never use `parseFloat`?
- What are the three layers that stand between a typed account number and money actually moving?
- Why is a wrong check digit on the client _not_ the thing that stops money going to the wrong
  person? What actually is?
- A transfer times out. Walk through exactly what the app does next, in order, and why it
  checks server status before deciding to roll back.
- What actually stops a double-click on Send from creating two transfers — is it the disabled
  button, the idempotency key, or both? Why do you need both?
- You see "We couldn't load this right now" on the dashboard. What's the actual mechanical
  cause, and how would you reproduce it on demand for someone who doesn't believe it's not a bug?
- Why can setting `failRate=0.5` look like "nothing happened," and what's the one setting that's
  always guaranteed to be visible?
- Why does editing one digit of an already-resolved account number instantly clear the name,
  with no visible flicker or stale state?
