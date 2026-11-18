import type { HouseholdRates, RateTable } from '../data/types';
import { HOUSEHOLD_RATINGS } from '../data/types';
import type { ColaFact } from '../data/cola';
import { applyBasisPoints } from './money';

/**
 * Build a PROJECTED rate table by applying a verified COLA to every official cell.
 *
 * This is an estimate, not an official VA rate. When VA publishes its own table for the
 * year, the official table must replace this projection (VA derives some dependent
 * amounts at 30–90% from the 100% amounts under 38 U.S.C. 1115 and may round them,
 * so official amounts can differ from this projection by small amounts).
 */
export function projectRateTable(base: RateTable, cola: ColaFact): RateTable {
  if (base.status !== 'official') throw new Error('Projection must start from an official table');
  const bp = cola.basisPoints;
  const household = {} as Record<(typeof HOUSEHOLD_RATINGS)[number], HouseholdRates>;
  for (const r of HOUSEHOLD_RATINGS) {
    const row = base.household[r];
    const next = {} as HouseholdRates;
    for (const key of Object.keys(row) as (keyof HouseholdRates)[]) {
      next[key] = applyBasisPoints(row[key], bp);
    }
    household[r] = next;
  }
  return {
    year: cola.rateYear,
    status: 'projected',
    effectiveDate: cola.effectiveDate,
    sourceUrl: cola.sourceUrl,
    retrievedDate: cola.lastVerified,
    low: { 10: applyBasisPoints(base.low[10], bp), 20: applyBasisPoints(base.low[20], bp) },
    household,
    projection: {
      basisYear: base.year,
      colaBasisPoints: bp,
      method:
        'Each official 2026 cell × (1 + COLA), rounded half-up to the cent, then the same household rules applied.',
    },
  };
}
