import { TABLE_I, TABLE_I_COLUMNS } from '../data/combinedRatingsTable';

/** Individual condition entered by the user. Ratings are whole percents (0–100). */
export type Extremity = 'arm' | 'leg';
export type Side = 'left' | 'right';

export interface Condition {
  id: string;
  rating: number;
  /** Set only when the condition affects an arm or a leg (upper / lower extremity). */
  extremity?: Extremity;
  side?: Side;
}

export interface CombineStep {
  kind: 'combine' | 'bilateral-factor' | 'round' | 'note';
  text: string;
  /** Combined value after this step. */
  value: number;
}

export interface CombinedResult {
  /** Exact combined value per Table I (before conversion to the nearest 10). */
  combinedValue: number;
  /** Final degree of disability, nearest 10 with 5s adjusted upward (§ 4.25(a)). */
  finalRating: number;
  bilateralApplied: boolean;
  /** Bilateral value (pool combined value + 10%), if applied. */
  bilateralValue?: number;
  /** IDs of conditions removed from the bilateral calculation under § 4.26(d). */
  excludedFromBilateral: string[];
  steps: CombineStep[];
  errors: string[];
}

export function validateConditions(conditions: Condition[]): string[] {
  const errors: string[] = [];
  if (conditions.length > 20) errors.push('Enter at most 20 conditions.');
  conditions.forEach((c, i) => {
    if (!Number.isInteger(c.rating) || c.rating < 0 || c.rating > 100) {
      errors.push(`Condition ${i + 1}: rating must be a whole number from 0 to 100.`);
    }
    if ((c.extremity && !c.side) || (!c.extremity && c.side)) {
      errors.push(`Condition ${i + 1}: choose both the limb and the side, or neither.`);
    }
  });
  return errors;
}

/**
 * Combine two values per 38 CFR § 4.25 Table I.
 * `a` is the larger (row, the accumulated value), `b` the smaller (column).
 * Table I lists rows 19–94 and columns 10–90; its every cell equals
 * round_half_up(a + b × (100 − a) / 100) (verified for all 684 cells in tests).
 * Outside the printed range (e.g. 10 with 10, bilateral values such as 21 in the
 * column, or rows above 94) the same efficiency method from § 4.25 is applied.
 */
export function combinePair(a: number, b: number): { value: number; viaTable: boolean } {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  if (lo === 0) return { value: hi, viaTable: false };
  if (hi >= 100) return { value: 100, viaTable: false };
  // Read the row/column as given (accumulated value in the row), else the transposed cell.
  for (const [r, col] of [
    [a, b],
    [b, a],
  ]) {
    const colIndex = (TABLE_I_COLUMNS as readonly number[]).indexOf(col);
    const row = TABLE_I[r];
    if (row && colIndex >= 0) return { value: row[colIndex], viaTable: true };
  }
  return { value: Math.floor((100 * hi + lo * (100 - hi) + 50) / 100), viaTable: false };
}

/** § 4.25(a): nearest number divisible by 10; values ending in 5 adjusted upward. */
export function roundToNearestTen(value: number): number {
  return Math.min(100, Math.floor((value + 5) / 10) * 10);
}

/** § 4.26: 10 percent of the combined value is ADDED (not combined); rounded half-up. */
export function applyBilateralFactor(value: number): number {
  return Math.min(100, Math.floor((value * 11 + 5) / 10));
}

function combineSequence(values: number[], steps: CombineStep[] | null, label = ''): number {
  const sorted = [...values].sort((x, y) => y - x);
  if (sorted.length === 0) return 0;
  let acc = sorted[0];
  steps?.push({ kind: 'combine', text: `${label}Start with the most severe: ${acc}%`, value: acc });
  for (const v of sorted.slice(1)) {
    const { value, viaTable } = combinePair(acc, v);
    steps?.push({
      kind: 'combine',
      text: `${label}Combine ${acc} with ${v} → ${value}${viaTable ? ' (Table I)' : ' (§ 4.25 efficiency method)'}`,
      value,
    });
    acc = value;
  }
  return acc;
}

function qualifiesForBilateral(pool: Condition[]): boolean {
  // § 4.26(c): compensable (>0%) partial disability in each of 2 paired extremities.
  const has = (e: Extremity, s: Side) => pool.some((c) => c.extremity === e && c.side === s && c.rating > 0);
  return (has('arm', 'left') && has('arm', 'right')) || (has('leg', 'left') && has('leg', 'right'));
}

/** Members of the bilateral group: every condition on an extremity pair that qualifies. */
function bilateralPool(conditions: Condition[]): Condition[] {
  const has = (e: Extremity, s: Side) =>
    conditions.some((c) => c.extremity === e && c.side === s && c.rating > 0);
  const arms = has('arm', 'left') && has('arm', 'right');
  const legs = has('leg', 'left') && has('leg', 'right');
  return conditions.filter(
    (c) => c.rating > 0 && ((arms && c.extremity === 'arm') || (legs && c.extremity === 'leg')),
  );
}

interface Evaluation {
  combinedValue: number;
  bilateralValue?: number;
  pool: Condition[];
  excluded: Condition[];
}

function evaluate(conditions: Condition[], excludedIds: Set<string>): Evaluation {
  const candidates = conditions.filter((c) => !excludedIds.has(c.id));
  const pool = qualifiesForBilateral(candidates) ? bilateralPool(candidates) : [];
  const poolIds = new Set(pool.map((c) => c.id));
  const others = conditions.filter((c) => !poolIds.has(c.id)).map((c) => c.rating);
  const excluded = conditions.filter((c) => excludedIds.has(c.id));
  if (pool.length === 0) {
    return { combinedValue: combineSequence(others, null), pool, excluded };
  }
  const poolValue = combineSequence(pool.map((c) => c.rating), null);
  const bilateralValue = applyBilateralFactor(poolValue);
  return {
    combinedValue: combineSequence([bilateralValue, ...others], null),
    bilateralValue,
    pool,
    excluded,
  };
}

/**
 * Full 38 CFR § 4.25 / § 4.26 calculation.
 *
 * § 4.26(d) exception: every way of removing bilateral disabilities from the bilateral
 * calculation is evaluated and the result most favorable to the veteran is used
 * (highest final rating; ties broken by the higher exact combined value, then by the
 * fewest removals so the standard method is preferred when equal).
 */
export function calculateCombinedRating(conditions: Condition[]): CombinedResult {
  const errors = validateConditions(conditions);
  const empty: CombinedResult = {
    combinedValue: 0,
    finalRating: 0,
    bilateralApplied: false,
    excludedFromBilateral: [],
    steps: [],
    errors,
  };
  if (errors.length || conditions.length === 0) return empty;

  const initialPool = qualifiesForBilateral(conditions) ? bilateralPool(conditions) : [];
  let best = evaluate(conditions, new Set());
  let bestRemovals = 0;
  const n = initialPool.length;
  if (n > 0 && n <= 12) {
    for (let mask = 1; mask < 1 << n; mask++) {
      const ids = new Set(initialPool.filter((_, i) => mask & (1 << i)).map((c) => c.id));
      const ev = evaluate(conditions, ids);
      const better =
        roundToNearestTen(ev.combinedValue) > roundToNearestTen(best.combinedValue) ||
        (roundToNearestTen(ev.combinedValue) === roundToNearestTen(best.combinedValue) &&
          (ev.combinedValue > best.combinedValue ||
            (ev.combinedValue === best.combinedValue && ids.size < bestRemovals)));
      if (better) {
        best = ev;
        bestRemovals = ids.size;
      }
    }
  }

  // Re-run the winning evaluation with step recording.
  const steps: CombineStep[] = [];
  const poolIds = new Set(best.pool.map((c) => c.id));
  const others = conditions.filter((c) => !poolIds.has(c.id));
  let combinedValue: number;
  if (best.pool.length > 0) {
    const poolValue = combineSequence(
      best.pool.map((c) => c.rating),
      steps,
      'Bilateral group: ',
    );
    const bv = applyBilateralFactor(poolValue);
    steps.push({
      kind: 'bilateral-factor',
      text: `Bilateral factor (§ 4.26): ${poolValue} + 10% of ${poolValue} (${(poolValue / 10).toFixed(1)}) = ${(poolValue * 1.1).toFixed(1)} → ${bv}. Treated as one disability from here on.`,
      value: bv,
    });
    if (best.excluded.length) {
      steps.push({
        kind: 'note',
        text: `§ 4.26(d): ${best.excluded.length} bilateral condition(s) combined separately because that gives a more favorable result.`,
        value: bv,
      });
    }
    combinedValue = combineSequence([bv, ...others.map((c) => c.rating)], steps);
  } else {
    if (best.excluded.length) {
      steps.push({
        kind: 'note',
        text: '§ 4.26(d): the bilateral factor is not used because combining these ratings separately gives a more favorable result.',
        value: 0,
      });
    }
    combinedValue = combineSequence(
      others.map((c) => c.rating),
      steps,
    );
  }
  const finalRating = roundToNearestTen(combinedValue);
  steps.push({
    kind: 'round',
    text: `Convert ${combinedValue} to the nearest 10 (5s round up) → ${finalRating}%`,
    value: finalRating,
  });

  return {
    combinedValue,
    finalRating,
    bilateralApplied: best.pool.length > 0,
    bilateralValue: best.bilateralValue,
    excludedFromBilateral: best.excluded.map((c) => c.id),
    steps,
    errors: [],
  };
}
