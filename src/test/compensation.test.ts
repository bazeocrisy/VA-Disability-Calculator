import { describe, expect, it } from 'vitest';
import { RATES_2026 } from '../data/rates2026';
import { COLA_2027 } from '../data/cola';
import { HOUSEHOLD_RATINGS, type PayableRating } from '../data/types';
import { calculateCompensation, type Household } from '../lib/compensation';
import { projectRateTable } from '../lib/projection';
import { applyBasisPoints, formatCents, formatMultiplier, formatPercentFromBasisPoints } from '../lib/money';
import { loadVaSnapshot, dollarsToCents } from './snapshot';

const base: Household = {
  rating: 30,
  hasSpouse: false,
  spouseAidAndAttendance: false,
  dependentParents: 0,
  childrenUnder18: 0,
  schoolChildren: 0,
};

/**
 * Oracle built ONLY from the saved VA page (not from src/data), using VA's written method:
 * find the basic-rate row, then add "Added amounts" for each additional child and A&A.
 */
function oracle() {
  const { tables } = loadVaSnapshot();
  const cell = (tIdx: number, row: number, rating: number) => {
    const t = tables[tIdx];
    const col = t.rows[0].findIndex((h) => h.startsWith(`${rating}%`));
    return dollarsToCents(t.rows[row][col]);
  };
  return (h: Household): number => {
    const lo = h.rating <= 60;
    const noKids = lo ? 1 : 3;
    const kids = lo ? 5 : 7;
    const added = lo ? 6 : 8;
    // Row index on the page: 1 alone/child, 2 spouse, 3 spouse+1p, 4 spouse+2p, 5 1p, 6 2p
    const row = h.hasSpouse ? 2 + h.dependentParents : h.dependentParents === 0 ? 1 : 4 + h.dependentParents;
    const total = h.childrenUnder18 + h.schoolChildren;
    let sum = total > 0 ? cell(kids, row, h.rating) : cell(noKids, row, h.rating);
    sum += Math.max(0, h.childrenUnder18 - 1) * cell(added, 1, h.rating);
    sum += h.schoolChildren * cell(added, 2, h.rating);
    if (h.hasSpouse && h.spouseAidAndAttendance) sum += cell(added, 3, h.rating);
    return sum;
  };
}

describe('VA worked examples (quoted on the VA.gov rates page)', () => {
  it('30%, spouse only → $617.47', () => {
    const r = calculateCompensation({ ...base, hasSpouse: true }, RATES_2026);
    expect(r.kind === 'ok' && r.monthly).toBe(61747);
  });
  it('70%, spouse + 3 children under 18 + spouse A&A → $2,367.45', () => {
    const r = calculateCompensation(
      { ...base, rating: 70, hasSpouse: true, spouseAidAndAttendance: true, childrenUnder18: 3 },
      RATES_2026,
    );
    expect(r.kind).toBe('ok');
    if (r.kind === 'ok') {
      expect(r.monthly).toBe(236745);
      expect(r.annual).toBe(236745 * 12);
      expect(r.lines.map((l) => l.cents)).toEqual([207445, 15200, 14100]);
    }
  });
});

describe('every dependent permutation at 30–100% matches the official-page oracle', () => {
  const expected = oracle();
  let count = 0;
  for (const rating of HOUSEHOLD_RATINGS) {
    it(`${rating}%`, () => {
      for (const hasSpouse of [false, true])
        for (const aa of hasSpouse ? [false, true] : [false])
          for (const parents of [0, 1, 2] as const)
            for (let minors = 0; minors <= 5; minors++)
              for (let school = 0; school <= 4; school++) {
                const h: Household = {
                  rating,
                  hasSpouse,
                  spouseAidAndAttendance: aa,
                  dependentParents: parents,
                  childrenUnder18: minors,
                  schoolChildren: school,
                };
                const r = calculateCompensation(h, RATES_2026);
                if (minors === 0 && school > 0) {
                  expect(r.kind, JSON.stringify(h)).toBe('unsupported');
                  continue;
                }
                expect(r.kind, JSON.stringify(h)).toBe('ok');
                if (r.kind === 'ok') {
                  expect(r.monthly, JSON.stringify(h)).toBe(expected(h));
                  expect(r.annual).toBe(r.monthly * 12);
                  expect(r.lines.reduce((s, l) => s + l.cents, 0)).toBe(r.monthly);
                }
                count++;
              }
    });
  }
  it('ran the full permutation set', () => {
    // 8 ratings × 3 spouse states × 3 parent counts × (6×5 − 4 school-only) supported combos
    expect(count).toBe(8 * 3 * 3 * 26);
  });
});

describe('10% and 20%: dependents never change payment', () => {
  for (const rating of [10, 20] as const) {
    it(`${rating}% is invariant`, () => {
      const alone = calculateCompensation({ ...base, rating }, RATES_2026);
      expect(alone.kind === 'ok' && alone.monthly).toBe(RATES_2026.low[rating]);
      for (const hasSpouse of [false, true])
        for (const parents of [0, 1, 2] as const)
          for (const minors of [0, 1, 3])
            for (const school of [0, 1, 2]) {
              const r = calculateCompensation(
                {
                  rating,
                  hasSpouse,
                  spouseAidAndAttendance: hasSpouse,
                  dependentParents: parents,
                  childrenUnder18: minors,
                  schoolChildren: school,
                },
                RATES_2026,
              );
              expect(r.kind).toBe('ok');
              if (r.kind === 'ok') expect(r.monthly).toBe(RATES_2026.low[rating]);
            }
    });
  }
  it('official values: 10% $180.42, 20% $356.66', () => {
    expect(RATES_2026.low).toEqual({ 10: 18042, 20: 35666 });
  });
});

describe('unsupported and invalid situations never produce a number', () => {
  it('SMC is unsupported at every rating', () => {
    for (const rating of [10, 20, 30, 100] as PayableRating[]) {
      const r = calculateCompensation({ ...base, rating, receivesSMC: true }, RATES_2026);
      expect(r.kind).toBe('unsupported');
      expect('monthly' in r).toBe(false);
    }
  });
  it('only school children (no child under 18) is unsupported at 30–100%', () => {
    const r = calculateCompensation({ ...base, rating: 50, schoolChildren: 1 }, RATES_2026);
    expect(r.kind).toBe('unsupported');
  });
  it('rejects invalid input', () => {
    expect(calculateCompensation({ ...base, rating: 35 as PayableRating }, RATES_2026).kind).toBe('invalid');
    expect(calculateCompensation({ ...base, childrenUnder18: -1 }, RATES_2026).kind).toBe('invalid');
    expect(calculateCompensation({ ...base, childrenUnder18: 1.5 }, RATES_2026).kind).toBe('invalid');
    expect(calculateCompensation({ ...base, spouseAidAndAttendance: true }, RATES_2026).kind).toBe('invalid');
    expect(calculateCompensation({ ...base, dependentParents: 3 as 2 }, RATES_2026).kind).toBe('invalid');
  });
});

describe('VA-recognized permanently incapable adult child (not yet supported)', () => {
  const p27 = projectRateTable(RATES_2026, COLA_2027);
  it('suppresses totals at every rating from 30% to 100%, for 2026 and projected 2027', () => {
    for (const rating of HOUSEHOLD_RATINGS) {
      for (const extra of [{}, { hasSpouse: true }, { childrenUnder18: 2 }, { schoolChildren: 1, childrenUnder18: 1 }]) {
        for (const table of [RATES_2026, p27]) {
          const r = calculateCompensation({ ...base, ...extra, rating, permanentlyIncapableAdultChild: true }, table);
          expect(r.kind, `${rating}% ${JSON.stringify(extra)}`).toBe('unsupported');
          expect('monthly' in r).toBe(false);
          if (r.kind === 'unsupported') expect(r.reasons.join(' ')).toMatch(/permanently incapable of self-support/);
        }
      }
    }
  });
  it('at 10% and 20% the total is complete (VA: dependents never change these rates) and a note explains why', () => {
    for (const rating of [10, 20] as const) {
      const r = calculateCompensation({ ...base, rating, permanentlyIncapableAdultChild: true }, RATES_2026);
      expect(r.kind).toBe('ok');
      if (r.kind === 'ok') {
        expect(r.monthly).toBe(RATES_2026.low[rating]);
        expect(r.notes.join(' ')).toMatch(/permanently incapable of self-support/);
      }
    }
  });
  it('the flag defaults to off and does not affect ordinary households', () => {
    const r = calculateCompensation({ ...base, rating: 70, hasSpouse: true }, RATES_2026);
    expect(r.kind === 'ok' && r.monthly).toBe(196145);
  });
});

describe('2027 projection', () => {
  const p = projectRateTable(RATES_2026, COLA_2027);
  it('is labeled projected and never official', () => {
    expect(p.status).toBe('projected');
    expect(p.year).toBe(2027);
    expect(p.projection?.colaBasisPoints).toBe(360);
    expect(COLA_2027.vaTablesPublished).toBe(false);
    const r = calculateCompensation({ ...base, rating: 100 }, p);
    expect(r.kind === 'ok' && r.status).toBe('projected');
  });
  it('applies 3.6% to every cell with half-up cent rounding', () => {
    expect(p.low[10]).toBe(18692); // 180.42 × 1.036 = 186.91512 → 186.92
    expect(p.household[100].alone).toBe(408037); // 3938.58 × 1.036 = 4080.36888 → 4080.37
    for (const r of HOUSEHOLD_RATINGS) {
      for (const [k, v] of Object.entries(RATES_2026.household[r])) {
        const projected = p.household[r][k as 'alone'];
        expect(Number.isSafeInteger(projected)).toBe(true);
        // exact rational check: |projected − v×1.036| ≤ 0.5 cent
        expect(Math.abs(projected * 1000 - v * 1036)).toBeLessThanOrEqual(500);
      }
    }
  });
  it('refuses to project from a projected table', () => {
    expect(() => projectRateTable(p, COLA_2027)).toThrow();
  });
});

describe('money helpers', () => {
  it('rounds half-up in integer math', () => {
    expect(applyBasisPoints(1250, 400)).toBe(1300); // 13.00
    expect(applyBasisPoints(125, 200)).toBe(128); // 127.5 → 128
    expect(applyBasisPoints(100, 0)).toBe(100);
  });
  it('formats the COLA as an exact multiplier and percent', () => {
    expect(formatMultiplier(360)).toBe('1.036');
    expect(formatPercentFromBasisPoints(360)).toBe('3.6%');
    expect(formatMultiplier(280)).toBe('1.028');
    expect(formatMultiplier(25)).toBe('1.0025');
    expect(formatMultiplier(0)).toBe('1');
    expect(formatPercentFromBasisPoints(1000)).toBe('10%');
  });
  it('formats cents', () => {
    expect(formatCents(393858)).toBe('$3,938.58');
    expect(formatCents(5)).toBe('$0.05');
    expect(formatCents(-1200)).toBe('-$12.00');
    expect(() => formatCents(1.5)).toThrow();
  });
});
