import { describe, expect, it } from 'vitest';
import { RATES_2026 } from '../data/rates2026';
import type { HouseholdRates } from '../data/types';
import { loadVaSnapshot, dollarsToCents } from './snapshot';

const NO_CHILD_LABELS: [string, keyof HouseholdRates][] = [
  ['Veteran alone (no dependents)', 'alone'],
  ['With spouse (no parents or children)', 'spouse'],
  ['With spouse and 1 parent (no children)', 'spouse1p'],
  ['With spouse and 2 parents (no children)', 'spouse2p'],
  ['With 1 parent (no spouse or children)', 'p1'],
  ['With 2 parents (no spouse or children)', 'p2'],
];
// Row order on the VA page (labels differ slightly between the 30–60 and 70–100 tables).
const CHILD_KEYS: (keyof HouseholdRates)[] = ['child', 'childSpouse', 'childSpouse1p', 'childSpouse2p', 'child1p', 'child2p'];
const ADDED: [RegExp, keyof HouseholdRates][] = [
  [/^Each additional child under age 18$/, 'additionalChildUnder18'],
  [/^Each additional child over age 18 in a qualifying school program$/, 'additionalSchoolChild'],
  [/^Spouse receiving Aid and Attendance$/, 'spouseAidAndAttendance'],
];

describe('2026 rates match the saved official VA.gov page cell-for-cell', () => {
  const { tables, text } = loadVaSnapshot();
  let verified = 0;

  it('page metadata: effective date, last updated, no 2027 table yet', () => {
    expect(text).toContain('Effective December 1, 2025');
    expect(text).toContain('Last updated: November 2, 2026');
    expect(text).not.toMatch(/Effective December 1, 2026/);
    expect(RATES_2026.effectiveDate).toBe('2025-12-01');
    expect(RATES_2026.status).toBe('official');
  });

  it('has the expected 9 tables', () => {
    expect(tables).toHaveLength(9);
  });

  it('10% and 20% cells', () => {
    const t = tables[0];
    expect(t.rows[1]).toEqual(['10%', expect.any(String)]);
    expect(dollarsToCents(t.rows[1][1])).toBe(RATES_2026.low[10]);
    expect(dollarsToCents(t.rows[2][1])).toBe(RATES_2026.low[20]);
    verified += 2;
  });

  const ratingCols = (header: string[]) => header.slice(1).map((h) => Number(/^(\d+)%/.exec(h)![1]));

  it('basic monthly rates without children (48 cells)', () => {
    for (const t of [tables[1], tables[3]]) {
      expect(t.title).toMatch(/^Basic monthly rates for (30% to 60%|70% to 100%) disability rating$/);
      const cols = ratingCols(t.rows[0]);
      t.rows.slice(1).forEach((row, i) => {
        expect(row[0]).toBe(NO_CHILD_LABELS[i][0]);
        cols.forEach((rating, j) => {
          const expected = dollarsToCents(row[j + 1]);
          expect(RATES_2026.household[rating as 30][NO_CHILD_LABELS[i][1]], `${rating}% ${row[0]}`).toBe(expected);
          verified++;
        });
      });
    }
  });

  it('basic monthly rates with 1 child (48 cells)', () => {
    for (const t of [tables[5], tables[7]]) {
      const cols = ratingCols(t.rows[0]);
      expect(t.rows).toHaveLength(7);
      t.rows.slice(1).forEach((row, i) => {
        expect(row[0]).toMatch(/child/i);
        cols.forEach((rating, j) => {
          expect(RATES_2026.household[rating as 30][CHILD_KEYS[i]], `${rating}% ${row[0]}`).toBe(
            dollarsToCents(row[j + 1]),
          );
          verified++;
        });
      });
    }
  });

  it('added amounts (24 cells) and the duplicated A&A tables agree', () => {
    for (const t of [tables[6], tables[8]]) {
      const cols = ratingCols(t.rows[0]);
      t.rows.slice(1).forEach((row) => {
        const key = ADDED.find(([re]) => re.test(row[0]))![1];
        cols.forEach((rating, j) => {
          expect(RATES_2026.household[rating as 30][key], `${rating}% ${row[0]}`).toBe(dollarsToCents(row[j + 1]));
          verified++;
        });
      });
    }
    for (const t of [tables[2], tables[4]]) {
      const cols = ratingCols(t.rows[0]);
      cols.forEach((rating, j) =>
        expect(RATES_2026.household[rating as 30].spouseAidAndAttendance).toBe(dollarsToCents(t.rows[1][j + 1])),
      );
    }
  });

  it('covers all 122 populated official cells', () => {
    expect(verified).toBe(122);
  });

  it('every stored value is an integer number of cents', () => {
    for (const r of Object.values(RATES_2026.household)) {
      for (const v of Object.values(r)) expect(Number.isSafeInteger(v)).toBe(true);
    }
  });
});
