import type { Cents, HouseholdRates, PayableRating, RateTable } from '../data/types';
import { PAYABLE_RATINGS } from '../data/types';

export const MAX_CHILDREN = 15;

export interface Household {
  rating: PayableRating;
  hasSpouse: boolean;
  /** Spouse receives Aid and Attendance (requires hasSpouse). */
  spouseAidAndAttendance: boolean;
  dependentParents: 0 | 1 | 2;
  childrenUnder18: number;
  /** Children ages 18–23 attending a qualifying school program. */
  schoolChildren: number;
  /** User-declared special situations. We never infer eligibility for these. */
  receivesSMC?: boolean;
}

export interface LineItem {
  label: string;
  cents: Cents;
  /** Which official table row or added amount this line comes from. */
  source: string;
}

export type CompensationResult =
  | {
      kind: 'ok';
      year: number;
      status: RateTable['status'];
      monthly: Cents;
      annual: Cents;
      lines: LineItem[];
      notes: string[];
    }
  | { kind: 'unsupported'; year: number; reasons: string[] }
  | { kind: 'invalid'; errors: string[] };

export function validateHousehold(h: Household): string[] {
  const errors: string[] = [];
  if (!(PAYABLE_RATINGS as readonly number[]).includes(h.rating)) {
    errors.push('Disability rating must be 10% to 100% in steps of 10.');
  }
  for (const [name, v] of [
    ['Children under 18', h.childrenUnder18],
    ['Children 18–23 in school', h.schoolChildren],
  ] as const) {
    if (!Number.isInteger(v) || v < 0 || v > MAX_CHILDREN) {
      errors.push(`${name} must be a whole number from 0 to ${MAX_CHILDREN}.`);
    }
  }
  if (![0, 1, 2].includes(h.dependentParents)) errors.push('Dependent parents must be 0, 1, or 2.');
  if (h.spouseAidAndAttendance && !h.hasSpouse) {
    errors.push('Spouse Aid and Attendance requires a spouse.');
  }
  return errors;
}

function basicRowKey(h: Household, withChild: boolean): keyof HouseholdRates {
  const p = h.dependentParents;
  if (withChild) {
    if (h.hasSpouse) return p === 0 ? 'childSpouse' : p === 1 ? 'childSpouse1p' : 'childSpouse2p';
    return p === 0 ? 'child' : p === 1 ? 'child1p' : 'child2p';
  }
  if (h.hasSpouse) return p === 0 ? 'spouse' : p === 1 ? 'spouse1p' : 'spouse2p';
  return p === 0 ? 'alone' : p === 1 ? 'p1' : 'p2';
}

const ROW_LABELS: Record<string, string> = {
  alone: 'Veteran alone (no dependents)',
  spouse: 'With spouse (no parents or children)',
  spouse1p: 'With spouse and 1 parent (no children)',
  spouse2p: 'With spouse and 2 parents (no children)',
  p1: 'With 1 parent (no spouse or children)',
  p2: 'With 2 parents (no spouse or children)',
  child: 'Veteran with 1 child only (no spouse or parents)',
  childSpouse: 'With 1 child and spouse (no parents)',
  childSpouse1p: 'With 1 child, spouse, and 1 parent',
  childSpouse2p: 'With 1 child, spouse, and 2 parents',
  child1p: 'With 1 child and 1 parent (no spouse)',
  child2p: 'With 1 child and 2 parents (no spouse)',
};

/**
 * Monthly compensation from an official (or clearly projected) VA rate table.
 *
 * Method — exactly as VA's veteran-rates page instructs:
 *  1. 10%/20%: single rate; dependents never change it.
 *  2. 30–100%: pick the "Basic monthly rates" row matching spouse / parents / (1 child).
 *  3. If more than one child, add "Each additional child under age 18" for each additional
 *     minor and "Each additional child over age 18 in a qualifying school program" for each
 *     school child. The basic "1 child" row already pays for the first (under-18) child.
 *  4. Add "Spouse receiving Aid and Attendance" if applicable.
 *
 * Unsupported (no number shown):
 *  - Special Monthly Compensation: requires VA's SMC tables and an SMC award; never inferred.
 *  - Children who are ALL 18–23 in school (no child under 18): VA's page does not state how
 *    the first-child row applies when that child is a school child, so we do not guess.
 */
export function calculateCompensation(h: Household, table: RateTable): CompensationResult {
  const errors = validateHousehold(h);
  if (errors.length) return { kind: 'invalid', errors };

  const reasons: string[] = [];
  if (h.receivesSMC) {
    reasons.push(
      'Special Monthly Compensation (SMC) is paid from separate VA SMC rate tables based on the specific SMC level VA awarded. This calculator does not estimate SMC. See VA’s SMC rate tables.',
    );
  }
  const notes: string[] = [];
  const hasDependents =
    h.hasSpouse || h.dependentParents > 0 || h.childrenUnder18 > 0 || h.schoolChildren > 0;

  if (h.rating === 10 || h.rating === 20) {
    if (reasons.length) return { kind: 'unsupported', year: table.year, reasons };
    const cents = table.low[h.rating];
    if (hasDependents) {
      notes.push(
        'At 10% and 20%, VA does not pay additional compensation for a spouse, children, or parents.',
      );
    }
    return {
      kind: 'ok',
      year: table.year,
      status: table.status,
      monthly: cents,
      annual: cents * 12,
      lines: [{ label: `Basic rate at ${h.rating}%`, cents, source: `${h.rating}% rate` }],
      notes,
    };
  }

  const totalChildren = h.childrenUnder18 + h.schoolChildren;
  if (totalChildren > 0 && h.childrenUnder18 === 0) {
    reasons.push(
      'All of your children are 18–23 and in school. VA’s published rate page does not explain how to apply its “1 child” rate when that child is a school child, so we will not estimate this case. VA will calculate the exact amount; you can also call VA at 800-827-1000.',
    );
  }
  if (reasons.length) return { kind: 'unsupported', year: table.year, reasons };

  const rates = table.household[h.rating];
  const rowKey = basicRowKey(h, totalChildren > 0);
  const lines: LineItem[] = [
    { label: ROW_LABELS[rowKey], cents: rates[rowKey], source: `Basic monthly rate, ${h.rating}%` },
  ];
  const extraMinors = Math.max(0, h.childrenUnder18 - 1);
  if (extraMinors > 0) {
    lines.push({
      label: `Additional child under 18 × ${extraMinors}`,
      cents: rates.additionalChildUnder18 * extraMinors,
      source: `Added amount: each additional child under age 18 (${h.rating}%)`,
    });
  }
  if (h.schoolChildren > 0) {
    lines.push({
      label: `Child 18–23 in school × ${h.schoolChildren}`,
      cents: rates.additionalSchoolChild * h.schoolChildren,
      source: `Added amount: each additional child over age 18 in a qualifying school program (${h.rating}%)`,
    });
  }
  if (h.hasSpouse && h.spouseAidAndAttendance) {
    lines.push({
      label: 'Spouse receiving Aid and Attendance',
      cents: rates.spouseAidAndAttendance,
      source: `Added amount: spouse receiving Aid and Attendance (${h.rating}%)`,
    });
  }
  const monthly = lines.reduce((sum, l) => sum + l.cents, 0);
  return {
    kind: 'ok',
    year: table.year,
    status: table.status,
    monthly,
    annual: monthly * 12,
    lines,
    notes,
  };
}
