/** Integer number of US cents. Never a fractional value. */
export type Cents = number;

export const HOUSEHOLD_RATINGS = [30, 40, 50, 60, 70, 80, 90, 100] as const;
export type HouseholdRating = (typeof HOUSEHOLD_RATINGS)[number];
export const PAYABLE_RATINGS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;
export type PayableRating = (typeof PAYABLE_RATINGS)[number];

/**
 * One rating column of the VA "Basic monthly rates" and "Added amounts" tables.
 * Keys mirror the official VA row labels (see comments in rates2026.ts).
 */
export interface HouseholdRates {
  /** Veteran alone (no dependents) */
  alone: Cents;
  /** With spouse (no parents or children) */
  spouse: Cents;
  /** With spouse and 1 parent (no children) */
  spouse1p: Cents;
  /** With spouse and 2 parents (no children) */
  spouse2p: Cents;
  /** With 1 parent (no spouse or children) */
  p1: Cents;
  /** With 2 parents (no spouse or children) */
  p2: Cents;
  /** Veteran with 1 child only (no spouse or parents) */
  child: Cents;
  /** With 1 child and spouse (no parents) */
  childSpouse: Cents;
  /** With 1 child, spouse, and 1 parent */
  childSpouse1p: Cents;
  /** With 1 child, spouse, and 2 parents */
  childSpouse2p: Cents;
  /** With 1 child and 1 parent (no spouse) */
  child1p: Cents;
  /** With 1 child and 2 parents (no spouse) */
  child2p: Cents;
  /** Added amount: each additional child under age 18 */
  additionalChildUnder18: Cents;
  /** Added amount: each additional child over age 18 in a qualifying school program */
  additionalSchoolChild: Cents;
  /** Added amount: spouse receiving Aid and Attendance */
  spouseAidAndAttendance: Cents;
}

export interface RateTable {
  year: number;
  /** 'official' = published by VA. 'projected' = computed estimate, NOT an official VA rate. */
  status: 'official' | 'projected';
  effectiveDate: string;
  sourceUrl: string;
  sourcePageLastUpdated?: string;
  retrievedDate: string;
  /** 10% and 20%: dependents never change the amount. */
  low: Record<10 | 20, Cents>;
  household: Record<HouseholdRating, HouseholdRates>;
  /** Present only for projected tables. */
  projection?: {
    basisYear: number;
    colaBasisPoints: number;
    method: string;
  };
}
