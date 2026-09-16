# JOURNEY — the real story of the build

## Index

- **[DECISION]** J-001, J-002, J-003, J-004
- **[AI-MISTAKE]** J-002, J-005
- **[CORRECTION]** J-002
- **[ARCHITECTURE]** J-002, J-003

---

### J-001 · 2026-09-16 16:29 · CP-01 · commit: f9cfffc

**Chioma asked:** "read claude.md and begin implementation" (against the first version of `CLAUDE.md`, which described an autonomous, phase-based workflow where I would work through 11 phases, running checks and committing at the end of each one myself).

**What I did:** `git init`, scaffolded a Vite + React + TS app via `create-vite` (into a temp dir, then copied in, since the target directory wasn't empty), removed the default template's demo landing page, and installed a large batch of dependencies (TanStack Query, TanStack Virtual, react-hook-form, zod, Tailwind, MSW, Vitest, RTL, Playwright, axe, ESLint/Prettier) ahead of the checkpoints that would actually need them, to avoid repeated install round-trips. Ran `npx msw init public --save` and `npx playwright install --with-deps chromium` in the background.

**What went wrong:** Nothing broke, but this work was done under a workflow (autonomous phases, AI commits) that Chioma then replaced before I'd committed anything.

**Caught by:** me, on self-review, on re-reading `CLAUDE.md` at the start of the next turn.

**Chioma's correction:** (none yet on this point — see J-002 for the actual rewrite)

**Fix:** n/a — no commits had been made, so nothing needed undoing.

**Why it mattered for this app:** None, since no commit had happened yet. Logged for an honest record of what was built before the working agreement changed.

**Tags:** [DECISION]

---

### J-002 · 2026-09-16 16:42 · CP-01 · commit: f9cfffc

**Chioma asked:** Rewrote `CLAUDE.md` substantially (opened it in the IDE, edited it), then said "claude md is updated, read and continue". The new version introduces a checkpoint workflow (section 0.1): I work one checkpoint at a time, stop after each with a structured report, and **never** run `git commit`/`push`/`reset`/`rebase`/`stash`/`checkout --`/`restore` — only Chioma commits. It also separates concerns more strictly per checkpoint (e.g. CP-01 is just the bare scaffold + these two docs; strict TypeScript, ESLint, and Prettier move to CP-02; Tailwind to CP-03; Vitest config to CP-04).

**What I did:** Re-read the new `CLAUDE.md` in full. Confirmed via `git status`/`git log` that nothing had been committed yet, so there was no history to reconcile. Trimmed the work from J-001 back to CP-01's actual scope: reverted `vite.config.ts` to the plain `react()` plugin only (had added the Tailwind plugin and a Vitest `test` block, which belong to CP-03/CP-04), and reverted `tsconfig.app.json` (had added `strict`/`noUncheckedIndexedAccess`, which belongs to CP-02). Left the batch-installed dependencies in `package.json`/`package-lock.json` in place rather than uninstalling them, and flagged that as a deviation under "Assumptions" in `BUILD_LOG.md` for Chioma to weigh in on, rather than silently deciding either way.

**What went wrong:** I'd started configuring later checkpoints' concerns (Tailwind, Vitest, strict TS) inside what was about to become CP-01's diff, before the checkpoint boundaries existed. Not a functional bug — caught before anything was committed — but worth logging since it's exactly the kind of scope-bleed the new section 0.1 exists to prevent.

**Caught by:** me, on self-review, comparing the work already done against the newly-written checkpoint table in section 8.

**Chioma's correction:** No explicit correction yet — this is my own reconciliation of earlier work against her rewritten brief. If she wants the batch-installed dependencies removed rather than flagged, that'll be logged as a real correction when she says so.

**Fix:** `vite.config.ts` reverted to `{ plugins: [react()] }`. `tsconfig.app.json` reverted to drop `strict`/`noUncheckedIndexedAccess` (deferred to CP-02). `BUILD_LOG.md` and this file created to close out CP-01.

**Why it mattered for this app:** If left as-is, CP-01's commit would have quietly included Tailwind wiring and strict-mode TypeScript config with no corresponding checkpoint entry or review point — exactly the "two concerns in one commit" problem section 0.1 is designed to prevent, and it would have made the diff harder for Chioma to review and revert cleanly if needed.

**Tags:** [AI-MISTAKE] [CORRECTION] [ARCHITECTURE] [DECISION]

---

### J-003 · 2026-09-16 16:46 · CP-02 · commit: pending

**Chioma asked:** "done, continue" (after committing CP-01), which per section 0.1 means proceed to CP-02: strict TS, ESLint (rules in 3.6), Prettier, husky + lint-staged, scripts.

**What I did:** Attempted `npm install -D eslint-plugin-jsx-a11y eslint-plugin-import husky lint-staged` on top of the already-installed `eslint@^10.10.0`. It failed: `eslint-plugin-jsx-a11y@6.10.2` (the latest published version) only declares peer support up to `eslint@^9`, so npm refused the install rather than risk a broken resolution.

**What went wrong:** Nothing broken in the app — this is an upstream ecosystem lag (ESLint 10 is very new; a core a11y plugin hasn't caught up). Caught before anything was force-installed.

**Caught by:** npm itself (`ERESOLVE` on install), before any code was written against it.

**Chioma's correction:** none — my own call.

**Fix:** Pinned `eslint` and `@eslint/js` down to `^9.39.5` (from the auto-installed `^10.x`) instead of using `--legacy-peer-deps`/`--force` to paper over the mismatch. ESLint 9's flat-config API is what every plugin here (`typescript-eslint`, `jsx-a11y`, `eslint-plugin-import`, `eslint-config-prettier`, `react-hooks`, `react-refresh`) is actually tested against, so this is the safer choice for a project someone else will `npm install` fresh on demo day — forcing an untested ESLint 10 + jsx-a11y combination could have produced silent rule failures that wouldn't surface until the panel ran `npm install` themselves.

**Why it mattered for this app:** A lint setup that fails to install cleanly, or silently mis-behaves under a forced peer-dependency override, would break the "one command" hard constraint (CLAUDE.md section 2) the panel explicitly checks.

**Tags:** [DECISION] [ARCHITECTURE]

---

### J-004 · 2026-09-16 16:48 · CP-02 · commit: pending

**Chioma asked:** (same CP-02 instruction as J-003) — "typescript-eslint (strict)" per CLAUDE.md 3.6.

**What I did:** Chose `tseslint.configs.strictTypeChecked` + `stylisticTypeChecked` (type-aware linting, via `projectService: true`) over the faster, non-type-checked `strict` config.

**What went wrong:** Nothing — a deliberate trade-off, not a mistake.

**Caught by:** n/a — self-review while writing `eslint.config.js`.

**Chioma's correction:** none yet.

**Fix:** n/a.

**Why it mattered for this app:** Type-aware rules (e.g. flagging floating promises, unsafe `any` leaks) matter more here than in a typical app, because the Send Money mutation lifecycle (CP-19) has several async handlers (`onMutate`/`onError`/`onSettled`) where a silently-dropped promise could mean a rollback never runs. The trade-off is slower lint runs (type info has to be built), which is worth flagging under "Review this" in BUILD_LOG in case it's annoying during the live demo — if so, it's a one-line swap to the non-type-checked `strict` config.

**Tags:** [DECISION]

---

### J-005 · 2026-09-16 16:52 · CP-02 · commit: pending

**Chioma asked:** (same CP-02 instruction) — husky + lint-staged pre-commit hook.

**What I did:** Ran `npx husky init`, then used the Write tool to replace the generated `.husky/pre-commit` content (default was `npm test`) with `npx lint-staged`.

**What went wrong:** The Write tool doesn't preserve the executable bit husky's own generator had set, so the rewritten `.husky/pre-commit` came back `-rw-r--r--` (not executable). A non-executable hook script is silently skipped by git on commit — the "lint-staged runs before every commit" guarantee from CLAUDE.md 3.6 would have quietly not held.

**Caught by:** me, on self-review — ran `ls -la .husky/` after writing the file and noticed the permission bits didn't look like husky's default.

**Chioma's correction:** none — caught before her review.

**Fix:** `chmod +x .husky/pre-commit`.

**Why it mattered for this app:** A pre-commit hook that never runs is worse than no hook at all, because BUILD_LOG and the deck would claim lint/format enforcement exists when it doesn't.

**Tags:** [AI-MISTAKE]

---
