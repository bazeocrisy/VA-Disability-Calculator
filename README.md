# VeteranPay — VA Disability Compensation Calculator

Independent, privacy-first VA compensation and combined-rating calculator.
**Not affiliated with the U.S. Department of Veterans Affairs.** VA determines official ratings and payments.

> Release status: built and tested; **awaiting human review before public deployment** (see [docs/audit.md](docs/audit.md)).

## What it does

- **Quick Pay** — official 2026 VA rates (effective Dec 1, 2025) and clearly labeled **projected** 2027 amounts (3.6% COLA) for ratings 10–100%, spouse, spouse Aid & Attendance, children under 18, children 18–23 in school, and 0–2 dependent parents. Monthly, annual, COLA difference, itemized breakdown, copy/print, reset.
- **Combined Rating** — 38 CFR § 4.25 Table I combination with exact intermediate values and final nearest-10 rounding; § 4.26 bilateral factor for arms/legs including the paragraph (d) "most favorable" exception; step-by-step explanation.
- **How It Works** and **Sources** — plain-language explanations and links to VA.gov, eCFR, and SSA.

## Accuracy model

| Layer | Where | Rule |
|---|---|---|
| Official rate data | `src/data/rates2026.ts` | Integer cents, parsed from VA.gov; 122 cells verified against saved page by test |
| Table I | `src/data/combinedRatingsTable.ts` | 684 cells parsed from eCFR; verified by test |
| COLA facts | `src/data/cola.ts` | Versioned, dated; 2027 marked not published by VA |
| Logic | `src/lib/*.ts` | No rates in logic; unsupported cases return warnings, never numbers |

Money is integer cents. Annual = monthly × 12. The only rounding is the 2027 projection (half-up to the cent).
Never inferred: TDIU, SMC. Unsupported (explicit warning, no totals): SMC amounts; households whose only children are 18–23 school children; an adult child VA recognized as permanently incapable of self-support (at 30%+).

Evidence: [docs/rate-sources.md](docs/rate-sources.md) · [docs/audit.md](docs/audit.md) · [docs/evidence/](docs/evidence/) · hero art status: [docs/hero-artwork.md](docs/hero-artwork.md)

## Develop

```bash
npm ci
npm run dev        # http://localhost:5173/VA-Disability-Calculator/
npm test           # rate-table, regulation, permutation and UI tests
npm run typecheck
npm run build      # dist/ with base /VA-Disability-Calculator/
```

React 18 + TypeScript + Vite + Vitest. Fonts are self-hosted (no third-party requests). No analytics, cookies, accounts, or server.

## Deploy

`.github/workflows/deploy.yml` is **manual only**, runs only from `main`, and refuses to deploy unless `docs/audit.md` contains exactly one valid approval record matching the reviewer name entered (rules in `scripts/release-approval.mjs`; format in `docs/audit.md`). Enable GitHub Pages → Source: GitHub Actions.

## Updating rates each year

1. Save the new VA.gov page to `docs/evidence/`, regenerate `src/data/ratesYYYY.ts` from it, point the snapshot test at it.
2. When VA publishes the projected year's table, replace the projection with the official table and remove the PROJECTED label.
3. Update `docs/rate-sources.md` and `docs/audit.md`.
