# Official rate provenance ledger

## 2026 VA disability compensation rates — OFFICIAL

| Field | Value |
|---|---|
| Source URL | https://www.va.gov/disability/compensation-rates/veteran-rates/ |
| Effective date (stated on page) | December 1, 2025 |
| Page "Last updated" | November 2, 2026 |
| Retrieved | 2026-11-18 (HTTP 200, 93,785 bytes) |
| Saved snapshot | `docs/evidence/va-veteran-rates-2026-retrieved-2026-11-18.html` (sha256 `edf7b243d2ecedbfb9d1d5aed3728fcd36b18e6fe8707fdc90dab0029c0d9ffe`) |
| Extraction | Cells parsed programmatically from the page's `<va-table>` / `<va-table-row>` markup (no manual retyping) into integer cents in `src/data/rates2026.ts` |
| Verification | `src/test/rates-vs-snapshot.test.ts` re-parses the snapshot with an independent parser and asserts all **122** populated cells; the duplicated Spouse A&A rows in the no-children and with-children tables were confirmed identical |
| 2027 table on page? | No. Page shows no "Effective December 1, 2026" table as of retrieval |

### Coverage matrix

| Table on VA page | Ratings | Rows | Cells |
|---|---|---|---|
| 10%–20% | 10, 20 | 1 | 2 |
| Basic monthly rates, no children | 30–60, 70–100 | 6 | 48 |
| Basic monthly rates, with 1 child | 30–60, 70–100 | 6 | 48 |
| Added amounts (additional child under 18; additional school child; spouse A&A) | 30–60, 70–100 | 3 | 24 |
| **Total populated cells** | | | **122** |

No VA cell is missing; no value was estimated or interpolated.

### 10% and 20% (dependents never change these)

| Rating | Monthly | Cents |
|---|---|---|
| 10% | $180.42 | 18042 |
| 20% | $356.66 | 35666 |

### 30%–100% (monthly; stored as integer cents in `src/data/rates2026.ts`)

| VA row label | 30% | 40% | 50% | 60% | 70% | 80% | 90% | 100% |
|---|---|---|---|---|---|---|---|---|
| Veteran alone (no dependents) | $552.47 | $795.84 | $1,132.90 | $1,435.02 | $1,808.45 | $2,102.15 | $2,362.30 | $3,938.58 |
| With spouse (no parents or children) | $617.47 | $882.84 | $1,241.90 | $1,566.02 | $1,961.45 | $2,277.15 | $2,559.30 | $4,158.17 |
| With spouse and 1 parent (no children) | $669.47 | $952.84 | $1,329.90 | $1,671.02 | $2,084.45 | $2,417.15 | $2,717.30 | $4,334.41 |
| With spouse and 2 parents (no children) | $721.47 | $1,022.84 | $1,417.90 | $1,776.02 | $2,207.45 | $2,557.15 | $2,875.30 | $4,510.65 |
| With 1 parent (no spouse or children) | $604.47 | $865.84 | $1,220.90 | $1,540.02 | $1,931.45 | $2,242.15 | $2,520.30 | $4,114.82 |
| With 2 parents (no spouse or children) | $656.47 | $935.84 | $1,308.90 | $1,645.02 | $2,054.45 | $2,382.15 | $2,678.30 | $4,291.06 |
| Veteran with 1 child only (no spouse or parents) | $596.47 | $853.84 | $1,205.90 | $1,523.02 | $1,910.45 | $2,219.15 | $2,494.30 | $4,085.43 |
| With 1 child and spouse (no parents) | $666.47 | $947.84 | $1,322.90 | $1,663.02 | $2,074.45 | $2,406.15 | $2,704.30 | $4,318.99 |
| With 1 child, spouse, and 1 parent | $718.47 | $1,017.84 | $1,410.90 | $1,768.02 | $2,197.45 | $2,546.15 | $2,862.30 | $4,495.23 |
| With 1 child, spouse, and 2 parents | $770.47 | $1,087.84 | $1,498.90 | $1,873.02 | $2,320.45 | $2,686.15 | $3,020.30 | $4,671.47 |
| With 1 child and 1 parent (no spouse) | $648.47 | $923.84 | $1,293.90 | $1,628.02 | $2,033.45 | $2,359.15 | $2,652.30 | $4,261.67 |
| With 1 child and 2 parents (no spouse) | $700.47 | $993.84 | $1,381.90 | $1,733.02 | $2,156.45 | $2,499.15 | $2,810.30 | $4,437.91 |
| Added: each additional child under age 18 | $32.00 | $43.00 | $54.00 | $65.00 | $76.00 | $87.00 | $98.00 | $109.11 |
| Added: each additional child over age 18 in a qualifying school program | $105.00 | $140.00 | $176.00 | $211.00 | $246.00 | $281.00 | $317.00 | $352.45 |
| Added: spouse receiving Aid and Attendance | $61.00 | $81.00 | $101.00 | $121.00 | $141.00 | $161.00 | $181.00 | $201.41 |

Cents = dollars × 100 exactly (e.g. $1,132.90 → 113290).

## 2027 — PROJECTED (not official)

| Field | Value |
|---|---|
| COLA | **3.6%** (360 basis points), Social Security COLA effective December 2026 / payable January 2027 |
| SSA announcement | "Social Security Announces 3.6 Percent Benefit Increase for 2027", October 14, 2026 — https://www.ssa.gov/news/en/press/releases/2026-10-14.html |
| How verified | Official ssa.gov press release, fact sheet (https://www.ssa.gov/news/en/cola/factsheets/2027.html) and SSA OIG notices returned by web search on 2026-11-18, all stating 3.6%. Direct download from ssa.gov was refused by SSA's CDN (HTTP 403 "Access Denied") from the build container, so no byte snapshot is stored. **Re-confirm in a browser before release.** |
| VA linkage | VA veteran-rates page: "We’re required by law to match the percentage of cost-of-living adjustments made to Social Security benefits." |
| Legislation | S. 4487, Veterans' Compensation Cost-of-Living Adjustment Act of 2026 (introduced 2026-05-11; text saved at `docs/evidence/S4487-introduced-2026-05-11.pdf`): increases §1114 and §1115(1) amounts effective Dec 1, 2026 by the SSA percentage. Enactment status could not be confirmed (congress.gov status page blocked by bot protection). |
| VA 2027 tables published? | **No** as of 2026-11-18 |
| Projection method | Every official 2026 cell × 1.036, rounded half-up to the cent in integer math (`src/lib/projection.ts`); household rules then applied identically. |
| Known deviation risk | VA derives several 30–90% dependent amounts from 100% amounts under 38 U.S.C. 1115 and may round them; published 2027 cells can differ from projections by small amounts. When VA publishes, replace the projection with an official `RATES_2027` table and a new snapshot. |

## 38 CFR §§ 4.25 and 4.26

| Item | Detail |
|---|---|
| § 4.25 source | https://www.ecfr.gov/current/title-38/chapter-I/part-4/subpart-A/section-4.25 (eCFR renderer API, retrieved 2026-11-18) — `docs/evidence/ecfr-38cfr4.25-retrieved-2026-11-18.html` (sha256 `429e73f1…a93a5`) |
| Table I | 76 rows (19–94) × 9 columns (10–90) = **684 cells**, parsed into `src/data/combinedRatingsTable.ts`; test asserts all 684 against the snapshot |
| Formula equivalence | Every one of the 684 cells equals `round_half_up(a + b(100 − a)/100)`; used only for values outside the printed table (e.g. 10 with 10, bilateral values like 21) |
| § 4.26 source | https://www.ecfr.gov/current/title-38/chapter-I/part-4/subpart-A/section-4.26 — `docs/evidence/ecfr-38cfr4.26-retrieved-2026-11-18.html` (as amended 88 FR 22917, Apr. 14, 2023, including paragraph (d) exception) |
