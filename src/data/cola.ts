/**
 * Cost-of-living adjustment (COLA) facts. Versioned data — no business logic.
 *
 * VA states it is required by law to match the Social Security COLA percentage. For December 1, 2026 the pending
 * bill S. 4487 (Veterans' Compensation Cost-of-Living Adjustment Act of 2026,
 * introduced 2026-05-11) ties the increase to the SSA percentage effective
 * December 1, 2026. See docs/rate-sources.md for the verification record.
 */
export interface ColaFact {
  /** Rate year the COLA produces (rates effective December 1 of the prior year). */
  rateYear: number;
  /** COLA in basis points (3.6% = 360). Integer to avoid floating-point drift. */
  basisPoints: number;
  effectiveDate: string;
  announcedBy: string;
  announcementDate: string;
  sourceUrl: string;
  lastVerified: string;
  /** Whether VA has published official rate tables reflecting this COLA. */
  vaTablesPublished: boolean;
}

export const COLA_2027: ColaFact = {
  rateYear: 2027,
  basisPoints: 360,
  effectiveDate: '2026-12-01',
  announcedBy: 'Social Security Administration',
  announcementDate: '2026-10-14',
  sourceUrl: 'https://www.ssa.gov/news/en/press/releases/2026-10-14.html',
  lastVerified: '2026-11-18',
  vaTablesPublished: false,
};

/**
 * VA's own statement (veteran-rates page, retrieved 2026-11-18):
 * "We're required by law to match the percentage of cost-of-living adjustments
 * made to Social Security benefits."
 */
export const VA_COLA_STATEMENT =
  'VA is required by law to match the percentage of cost-of-living adjustments made to Social Security benefits.';
