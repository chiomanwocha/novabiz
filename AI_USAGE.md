# AI Usage — NovaBiz Merchant Dashboard

How AI was used to build this take-home. Every decision and mistake below is drawn from an
append-only build journal kept during the work, not reconstructed afterward.

## Tools and their uses

**Claude Code** (Anthropic) was the only AI tool used. It worked checkpoint by checkpoint
(`CLAUDE.md`'s own workflow): one concern per checkpoint, a structured report after each, and
every commit made by hand after review — the tool never ran `git commit` itself.

The interesting part isn't _that_ AI was used — it's _how_:

- **Checkpoint discipline.** The AI proposed, I reviewed and committed. If a checkpoint touched
  something outside its scope, I caught it and pushed back. Every commit in the git history
  is mine.
- **Multiple rounds of manual feedback.** The core implementation landed first; then I tested it
  by hand across five rounds, filed real bugs and UX complaints, and had the AI fix them against
  my reports — not its own guesses about what was wrong.
- **Explicit boundaries.** From partway through the build, I stopped the AI from using automated
  browser tools to verify its own UI changes. Visual/CSS fixes were verified by me, by hand.
  The brand mark is a placeholder monogram, not a generated asset.
- Also used to build the case-study presentation deck (content, layout, speaker notes).

## Real prompts

Representative examples of the direction I gave during the build, drawn from the corresponding
`JOURNEY.md` entries. Tightened for clarity — the journal has the raw versions.

- **Enforcing naming standards (J-017):** The AI named a file `prng.ts`. I flagged it — file
  names need to be self-documenting. Other developers should understand what a module does from
  its name alone. Renamed to `seededRandom.ts`, and set a standing rule for the rest of the
  build: every name must be descriptive, no acronyms.
- **Pushing for business metrics (J-028):** The AI's first dashboard had a balance card and a
  transaction feed — technically complete, but not useful. A dashboard needs to show metrics
  that matter to the business. Even for small merchants, we need insights that help them
  understand their numbers: top payers, busiest days, weekly trends.
- **Reviewing from the user's perspective (J-031):** Would Mama Nkechi actually use this app?
  The dashboard needs to feel personalised — a greeting with the merchant's name, a soft and
  clean feel. Not fancy, but polished enough that it would pass a senior design review before
  going to market.
- **Catching a wrong business metric (J-048):** The "Top payer" insight was calculated by total
  transaction count. I flagged that the direction was wrong — a "payer" should be calculated
  from money _in_, not money out. The person who pays you the most is your best customer, not
  the person you send to the most.
- **Questioning mock server behaviour (J-050):** The failure-rate simulation didn't seem
  consistent across all pages at the same time. I asked for an explanation of how the mock
  controls actually propagate — either the implementation had a bug or I was misunderstanding
  the design. Turned out the controls were working correctly (shared in-memory object, read
  live by every handler), but the documentation didn't make that clear enough.
- **Reporting a real recurring bug (J-030):** Sent a screenshot of an "unexpected server
  response" error that kept appearing after periods of inactivity. The retry button didn't
  clear it — only a full page refresh worked. Reported it as a UX-breaking issue. It was
  misdiagnosed the first time, partially patched, and properly root-caused several rounds later
  (J-049) as a service worker losing control of the page after a hard reload.
- **Auditing the codebase (J-053):** Before the final push, I reviewed the folder structure
  and found inconsistencies — `test`, `tests`, and `__test__` folders coexisting, custom SVG
  icons where `lucide-react` would do. Asked the AI to audit the whole structure and recommend
  what to clean up. The standard I set: simple and defensible. Nothing over-engineered.
- **Setting tooling boundaries (J-047):** Stopped the AI from running browser automation to
  verify its own UI changes. I would test the UI manually myself — the AI handles
  implementation, I handle visual verification.

## Wrong or risky AI output

The `JOURNEY.md` entries tagged `[AI-MISTAKE]` and `[CORRECTION]` — 23 mistakes and 19
corrections total across the build. Here are the ones that mattered most:

**The silent ESLint rule (J-010).** The `parseFloat` ban on money files — the single most
important lint rule in a fintech app — was silently broken from the moment it was committed.
Two `no-restricted-globals` configs in ESLint shared the same key, and JavaScript objects
silently drop duplicate keys: the second one (banning `fetch` in components) overwrote the
first (banning `parseFloat` in money code). The linter was green the whole time. I caught it
by deliberately writing `parseFloat` in a money file and watching lint pass when it shouldn't
have. Fixed by merging both bans into one config per scope.

**The service worker race condition (J-030 → J-049).** The "unexpected server response" error
kept appearing, especially after hard reloads. It was first reported at J-030, misdiagnosed
as a simple retry issue, partially patched, and recurred. It wasn't properly root-caused until
J-049: after a hard reload, the browser's service worker can lose control of the page, so MSW
stops intercepting `/api/*` requests — they hit the real dev server, which returns HTML instead
of JSON. The real fix was detecting the uncontrolled state and silently self-healing with one
guarded reload before surfacing any error.

**Dashboard with no business metrics (J-028).** The AI's first dashboard had a balance card
and a transaction feed — technically complete per the brief, but useless to a merchant. It
took a direct prompt ("we need to show metrics that matter to the business") to get an insights
panel added. The AI built what was specified; I had to push for what was actually needed.

**`instanceof DOMException` failing in tests (J-023).** The abort-timeout logic used
`instanceof DOMException` to detect cancelled requests. Worked perfectly in the browser,
silently failed in the test environment (jsdom creates `DOMException` in a different realm,
so `instanceof` returns `false`). Fixed by checking `error.name === 'AbortError'` instead —
a string comparison that works everywhere.

**Name-enquiry "Top payer" logic (J-048).** The AI calculated "Top payer" by total transaction
count. I caught that the metric was filtering on the wrong direction — a payer is someone
paying _in_, not someone you're paying _out_ to. Not a crash — worse: a quietly wrong number
on a dashboard a merchant is supposed to trust.

<!-- Full list for reference:
AI-MISTAKE: J-002, J-005, J-010, J-015, J-016, J-022, J-023, J-024, J-025, J-028, J-030,
J-034, J-038, J-039, J-042, J-043, J-044, J-045, J-046, J-047, J-049, J-050, J-051

CORRECTION: J-002, J-007, J-009, J-014, J-017, J-019, J-027, J-029, J-031, J-032, J-033,
J-043, J-045, J-046, J-047, J-048, J-049, J-050, J-053
-->
