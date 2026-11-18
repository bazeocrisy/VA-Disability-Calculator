# Audit log

Build audited: branch `claude/veteranpay-calculator`, 2026-11-18. Every item below links to reproducible evidence. Items that are not done are marked as such.

## 1. Calculation audit

### 1a. Official 2026 rate table — PASS

- Source fetched from VA.gov on 2026-11-18 (HTTP 200); snapshot and sha256 in [rate-sources.md](rate-sources.md).
- `src/test/rates-vs-snapshot.test.ts`: independent parser reads the saved page and asserts **122 / 122** populated cells equal `src/data/rates2026.ts`; also asserts page text "Effective December 1, 2025", "Last updated: November 2, 2026", and that no December 1, 2026 table exists yet.
- VA's own worked examples reproduced exactly: 30% + spouse = **$617.47**; 70% + spouse + 3 children under 18 + spouse A&A = **$2,367.45** (lines $2,074.45 + $152.00 + $141.00).

### 1b. Dependent combinations — PASS

- `src/test/compensation.test.ts` builds an oracle **only from the saved VA page** (not from `src/data`) using VA's written method, and compares every combination of 8 ratings (30–100) × spouse {none, spouse, spouse + A&A} × parents {0,1,2} × children under 18 {0–5} × school children {0–4}: **1,872 supported combinations** match to the cent; the **288** combinations whose only children are school children correctly return *unsupported*.
- 10% and 20%: 54 dependent permutations each return exactly $180.42 / $356.66.

### 1c. Combined ratings (38 CFR § 4.25) — PASS

- 684 / 684 Table I cells parsed from eCFR equal the stored table; every cell also equals `round_half_up(a + b(100 − a)/100)` (used only outside the printed range).
- Regulation examples reproduced: 60 & 30 → 72; 50 & 30 → 65 → 70; 40 & 20 → 52 → 50; 60, 40, 20 → 76 → 81 → 80.
- 50 + 30 + 20 → 65 → 72 → **70**. Exact intermediate values used (early rounding would give 80).
- Rounding boundaries: 44→40, 45→50, 94→90, 95→100, 4→0, 5→10; 100% short-circuits; 0% adds nothing.
- Order invariance: 4 rating sets × 20 random orderings each give identical results.

### 1d. Bilateral factor (38 CFR § 4.26) — PASS

- Regulation example: 60, 20, bilateral 10/10 → 19 → 21 → order 60, 21, 20 → 68 → 74 → **70** (step values asserted).
- 10% is *added* (not combined), half-up: 19→21, 24→26, 25→28, 30→33.
- (a) all disabilities of a qualifying pair join the group; (b) four extremities → one group, one factor; (c) no factor when one side is 0% or absent, or for non-paired limbs (left arm + right leg).
- (d) exception: exhaustive check over every left/right arm pair (10–90) × an optional other rating (0–90), **810 cases**: result always equals max(standard, no-bilateral). Concrete case: legs 10/10 + 90 + 30 → 90% with the factor, **100%** without; calculator returns 100% and explains § 4.26(d).

### 1e. COLA projection — PASS (projection, not official)

- SSA 3.6% COLA (announced 2026-10-14). **Directly checked on SSA's official announcement** (https://www.ssa.gov/news/en/press/releases/2026-10-14.html) by the owner's independent reviewer (ChatGPT) on 2026-11-18: confirms 3.6%. The build container itself is still blocked by ssa.gov (HTTP 403), so no byte snapshot is stored. See [rate-sources.md](rate-sources.md).
- The UI states the projection as "2026 rates × 1.036 (a 3.6% increase)" (multiplier formatted from integer basis points; regression-tested).
- Every cell × 1.036, half-up to the cent in integer math; test asserts |projected × 1000 − official × 1036| ≤ 500 for all 120 household cells. Example: 100% alone $3,938.58 → $4,080.37.
- Projected tables are typed `status: 'projected'`, cannot be re-projected, and display "PROJECTED … not an official VA rate".

### 1f. Independent calculation review — 1 defect found and fixed

A separate reviewer agent, given only the code and the saved evidence files, built its own oracles (not the repo's tests):

| Area | Independent result |
|---|---|
| Rate cells | 122 / 122 match the VA page |
| Table I | 684 / 684 match eCFR; formula reproduces every cell |
| Combined rating fuzz | 200,000 random cases (≤ 7 conditions) match an oracle that tries every § 4.26(d) removal; order-reversal invariant |
| Household pay | 61,440 combinations (rating × spouse × A&A × parents × 0–15 minors × 0–15 school children) match for 2026 and projected 2027 |
| Projection / money | all 122 projected cells exact; no floating-point risk |

**Defect D1 (fixed):** the § 4.26(d) subset search was skipped when more than 12 conditions were in the bilateral group, so a 13-condition case returned 90% instead of 100%. Fix: exhaustive search up to 16 bilateral conditions (~0.3 s worst case); above 16 the calculator shows an explicit error and **no number**. Regression tests added (auditor's exact case → 100%; 17-member group → refusal). Validation now also requires ratings in steps of 10.

Concerns noted (not defects), handled as documented limitations: school-child-only households (unsupported, warning shown); adult child permanently incapable of self-support ("helpless child") — now an explicit yes/no control that suppresses totals at 30%+ (see 1h); paired skeletal muscles other than arms/legs not modeled (UI states this); 2027 projection may differ by cents from VA's published table.

### 1g. Second independent review (ChatGPT, commit 53109e8) — corrections applied

Reported by the owner: 61 tests and production build pass; all nine live VA tables match the saved evidence; 10,000 additional combined-rating checks matched. Required corrections and how each was closed:

| # | Correction | Resolution | Regression check |
|---|---|---|---|
| 1 | Sources said "2026 rates × 3.6%" | Now "2026 rates × 1.036 (a 3.6% increase)"; Quick Pay card uses the same wording | `ui.test.tsx` Sources wording; `compensation.test.ts` multiplier formatting |
| 2 | No control for a VA-recognized permanently disabled adult child | Yes/no checkbox (no medical details). At 30–100% both 2026 and 2027 totals, the COLA difference and the breakdown are suppressed with an explicit warning. At 10%/20% the total is complete (VA: dependents never change these rates) and a note says so | `compensation.test.ts` (8 ratings × 4 households × 2 years; 10/20%); `ui.test.tsx` (warning, no totals, no text/file/date inputs) |
| 3 | Deploy gate too weak | `deploy.yml` fails unless run from `main`; deploy job also conditioned on `main`; `scripts/release-approval.mjs` requires exactly one exact-format record matching the supplied reviewer; rejects missing, negated, example/placeholder, quoted/struck/reworded, duplicate, mismatched, invalid/future-dated approvals | `release-approval.test.ts` (12 tests incl. workflow structure and "audit.md is not currently approved") |
| 4 | React `fetchPriority` warning in tests | Lowercase `fetchpriority="high"` attribute | `ui.test.tsx` asserts zero console errors/warnings across all tabs and the attribute is present |
| 5 | SSA check | Recorded in 1e and rate-sources.md | — |

### 1i. Third independent review (commit f56e161) — approval-gate defect fixed

Reviewer confirmed 80 tests, typecheck, production build and GitHub CI pass, and found one defect: `checkReleaseApproval` accepted an approval record indented by four spaces (which Markdown renders as an indented code block, i.e. an example). Cause: the line was whitespace-normalized before matching.

Fix (`scripts/release-approval.mjs`): every approval-like line is validated **raw**. A line starting with a space, tab or non-breaking space is rejected as indented; the raw line must match the exact format (no extra internal or trailing whitespace; CRLF line endings tolerated). An indented example anywhere in the file blocks release even if a genuine record is also present.

Regression checks (`src/test/release-approval.test.ts`, 17 tests at 7ac0497; restructured in 1j):
- 4-space, tab, 8-space, mixed, 1–3-space, non-breaking-space and list-nested indented records cannot authorize release;
- an indented example next to a genuine record still blocks;
- irregular internal/trailing whitespace is rejected;
- a genuine standalone record still passes (LF and CRLF);
- the current `docs/audit.md` is blocked for any reviewer name and contains no approval-format line outside code fences;
- following the documented approval procedure on the real `audit.md` yields a valid approval (the document's own prose cannot self-block), while the same record indented does not.

Mutation check: the three new indentation/whitespace tests **fail against the f56e161 checker** and pass with the fix. CLI check: 4-space and tab-indented files exit 1 with "Approval line is indented"; a standalone record exits 0; the current audit exits 1.

### 1j. Fourth independent review (commit 7ac0497) — release-lifecycle conflict fixed

Reviewer confirmed the indentation fix, 85 tests, typecheck, build and GitHub CI. Remaining issue: a repository-state test required the live `audit.md` to contain no approval, so a legitimate future approval would fail `npm test`, which `deploy.yml` runs.

Fix (`src/test/release-approval.test.ts`, gate logic unchanged):
- Live-state assertion replaced by **fixtures** (`src/test/fixtures/audit-awaiting-approval.md`, `audit-approved.md`): awaiting-approval fixture rejected for any reviewer; valid approved accepted (LF and CRLF); mismatched reviewer, invalid/future date, placeholder, malformed, duplicate, revoked and 4-space/tab-indented records rejected.
- The live `audit.md` is checked only for **state-independent invariants**: it is either awaiting approval (status line present, gate blocks) or carries exactly one record that the gate accepts for its own reviewer.
- **Second defect found while doing this:** step 1 of the approval instructions quoted the bold status line word-for-word, so the instruction itself contained the negated wording the gate rejects — a reviewer who deleted only the status line as instructed would still have been blocked. The earlier procedure test missed it because its filter also removed the instruction line. Instruction reworded ("Delete the bold release-status line above"); the procedure test now deletes only the exact status line; a new test asserts that only the bold status line may contain negated approval wording.

Lifecycle verification on the real repository (then restored):

| State of live `audit.md` | Gate (`release-approval.mjs`) | typecheck | `npm test` | build |
|---|---|---|---|---|
| Awaiting approval (as committed) | exit 1 (negated status) | pass | 92 / 92 | pass |
| Validly approved via documented procedure (status line deleted, one record added) | exit 0; wrong / differently-cased name exit 1 | pass | 92 / 92 | pass |
| Illegitimate: record indented 4 spaces | exit 1 (indented) | — | 2 failures (expected) | — |

The live `audit.md` was restored to its awaiting-approval state afterwards (byte-identical to the pre-simulation copy).

### 1h. VA-recognized permanently incapable adult child

Not priced (no verified VA rate rule captured in evidence yet). The calculator collects only a yes/no and shows no total at 30–100%. Future support requires citing the official VA rule and adding tests.

## 2. Design audit

| Check | Result | Evidence |
|---|---|---|
| All six branches visibly represented | PASS — Army, Navy, Marine Corps, Air Force, Coast Guard, Space Force each shown with establishment year (1775, 1775, 1775, 1947, 1790, 2019) | `docs/screenshots/desktop-home.png`; UI test "represents all six branches" |
| Black male and female service members in hero art | PASS — six Black service members (3 men, 3 women, varied ages), one per branch, before the flag; reviewed at full size against the checklist | [hero-artwork.md](hero-artwork.md); `docs/screenshots/*-home.png`; UI test checks alt text and responsive sources |
| Accurate flag imagery | PASS — 13 stripes (7 red), 50 stars in 9 alternating rows of 6/5, EO 10834 proportions (1 : 1.9, union 7/13 × 0.76) | `src/components/AmericanFlag.tsx`; UI tests assert 50 stars, 7 red stripes, proportions |
| Color balance | Navy #071B33 / military #12365A / red #B22234 / white / gold #D4AF37 / charcoal intro band | screenshots |
| No unreadable text over images | PASS — headline sits on a ≥ 82% navy scrim; axe color-contrast reports 0 violations | section 4 |

## 3. Technical audit

| Check | Result |
|---|---|
| TypeScript (`tsc -b`, strict) | PASS — 0 errors |
| Automated tests (`vitest run`) | PASS — 92 tests in 5 files; 0 React/console warnings |
| Production build (`vite build`) | PASS — JS 187 kB (60 kB gzip), CSS 30 kB (6 kB gzip); fonts self-hosted |
| GitHub Pages base | PASS — `base: '/VA-Disability-Calculator/'`; CI greps built `index.html` for it |
| Responsive layout | PASS — 1440×900 desktop and iPhone 13: no horizontal overflow (`scrollWidth ≤ innerWidth`) |
| Console errors | PASS — 0 console errors, warnings or page errors on both viewports across all tabs and the adult-child warning state |
| Outbound links | va.gov ×4: HTTP 200. eCFR ×2: HTTP 302 (normal redirect). ssa.gov ×2 and congress.gov ×1: HTTP 403 bot-protection from the build container (the SSA announcement was since checked directly by the owner's reviewer) (Akamai "Access Denied" / Cloudflare challenge) — URLs confirmed in official search results; **re-check in a browser before release** |
| CI | `.github/workflows/ci.yml`: npm ci, typecheck, test, build, base-path check |
| Deployment | `.github/workflows/deploy.yml`: manual only; `main` only; `scripts/release-approval.mjs` must find exactly one valid approval record matching the reviewer entered when running the workflow |

## 4. Accessibility audit (WCAG 2.2 AA-oriented)

| Check | Result |
|---|---|
| axe-core 4.10 (tags wcag2a, 2aa, 21a, 21aa, 22aa) | **0 violations** in 12 scanned states — Home, Quick Pay, adult-child warning, Combined Rating, How It Works, Sources × desktop (1440×900) and mobile (iPhone 13). Raw output: [`evidence/ui-a11y-evidence-2026-11-18.json`](evidence/ui-a11y-evidence-2026-11-18.json); screenshots in `docs/screenshots/` incl. `*-adult-child-warning.png` |
| Keyboard | Skip link → nav → hero CTAs → tablist → form controls in logical order; tabs support ←/→/Home/End with roving tabindex; CTAs move focus to the selected tab; condition add/remove moves focus sensibly |
| Screen readers | Native fieldsets/legends and labels on every control; results announced via polite live region; tables have captions and header scope; decorative flag `aria-hidden`; placeholder art has descriptive `role="img"` label |
| Targets | All interactive targets ≥ 44 px (buttons 48–56 px) |
| Reduced motion | With `prefers-reduced-motion: reduce`, computed `animation-name` is `none` for all flag animations; smooth scroll disabled |
| Focus visibility | 3 px gold focus ring on all focusable elements |
| Not done | Manual testing with VoiceOver/NVDA/TalkBack on real devices |

## 5. Privacy review — PASS

No forms submit anywhere; no network requests after load (fonts bundled); no cookies, storage, analytics, or accounts. Inputs limited to rating, dependent counts, and yes/no flags — no names, SSNs, claim IDs, birth dates, or medical details.

## 6. Reviewer sign-off

| Review | Status |
|---|---|
| Independent automated calculation review | Done — 1 defect (D1) found and fixed; see 1f |
| Human accuracy review | **Not yet performed** |
| Hero artwork review | Done by Claude 2026-11-18 (see hero-artwork.md); owner to confirm |

**.** Deployment stays blocked until a human reviewer records approval here.

### How to record approval (for the human reviewer only)

1. Delete the bold release-status line above (the gate rejects any negated approval wording, so it must go).
2. Add exactly one line, on its own, **not indented** (no leading spaces or tabs), outside any code block, in this exact form:

```text
APPROVED FOR RELEASE — Reviewer: <your full name> — Date: YYYY-MM-DD
```

3. Merge to `main`, then run **Actions → Deploy to GitHub Pages** from `main`, entering the same name.

The example above is inside a code block, so it never counts as an approval.
APPROVED FOR RELEASE — Reviewer: bazeocrisy — Date: 2026-11-18
