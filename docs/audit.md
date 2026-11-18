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

- SSA 3.6% COLA (announced 2026-10-14) — see [rate-sources.md](rate-sources.md) for how verified and the limitation (ssa.gov blocked direct download from the build container).
- Every cell × 1.036, half-up to the cent in integer math; test asserts |projected × 1000 − official × 1036| ≤ 500 for all 120 household cells. Example: 100% alone $3,938.58 → $4,080.37.
- Projected tables are typed `status: 'projected'`, cannot be re-projected, and display "PROJECTED … not an official VA rate".

### 1f. Independent calculation review

_Pending — see section 6._

## 2. Design audit

| Check | Result | Evidence |
|---|---|---|
| All six branches visibly represented | PASS — Army, Navy, Marine Corps, Air Force, Coast Guard, Space Force each shown with establishment year (1775, 1775, 1775, 1947, 1790, 2019) | `docs/screenshots/desktop-home.png`; UI test "represents all six branches" |
| Black male and female service members in hero art | **NOT MET YET** — candidate generated in Canva but not exportable to the repo or reviewable at full size; labeled placeholder shown instead | [hero-artwork.md](hero-artwork.md) |
| Accurate flag imagery | PASS — 13 stripes (7 red), 50 stars in 9 alternating rows of 6/5, EO 10834 proportions (1 : 1.9, union 7/13 × 0.76) | `src/components/AmericanFlag.tsx`; UI tests assert 50 stars, 7 red stripes, proportions |
| Color balance | Navy #071B33 / military #12365A / red #B22234 / white / gold #D4AF37 / charcoal intro band | screenshots |
| No unreadable text over images | PASS — headline sits on a ≥ 82% navy scrim; axe color-contrast reports 0 violations | section 4 |

## 3. Technical audit

| Check | Result |
|---|---|
| TypeScript (`tsc -b`, strict) | PASS — 0 errors |
| Automated tests (`vitest run`) | PASS — 58 tests in 4 files |
| Production build (`vite build`) | PASS — JS 187 kB (60 kB gzip), CSS 30 kB (6 kB gzip); fonts self-hosted |
| GitHub Pages base | PASS — `base: '/VA-Disability-Calculator/'`; CI greps built `index.html` for it |
| Responsive layout | PASS — 1440×900 desktop and iPhone 13: no horizontal overflow (`scrollWidth ≤ innerWidth`) |
| Console errors | PASS — 0 console errors / page errors on both viewports while exercising both calculators |
| Outbound links | va.gov ×4: HTTP 200. eCFR ×2: HTTP 302 (normal redirect). ssa.gov ×2 and congress.gov ×1: HTTP 403 bot-protection from the build container (Akamai "Access Denied" / Cloudflare challenge) — URLs confirmed in official search results; **re-check in a browser before release** |
| CI | `.github/workflows/ci.yml`: npm ci, typecheck, test, build, base-path check |
| Deployment | `.github/workflows/deploy.yml`: manual only; refuses to run unless this file contains a recorded release approval |

## 4. Accessibility audit (WCAG 2.2 AA-oriented)

| Check | Result |
|---|---|
| axe-core 4.10 (tags wcag2a, 2aa, 21a, 21aa, 22aa) | **0 violations** on Quick Pay and Combined Rating, desktop and mobile |
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
| Independent automated calculation review | _pending_ |
| Human accuracy review | **Not yet performed** |
| Hero artwork review | **Not yet performed** (no final asset) |

**Release status: NOT APPROVED.** Deployment stays blocked until a human reviewer records approval here.
