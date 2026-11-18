import type { RateTable } from './types';

/**
 * OFFICIAL 2026 VA disability compensation rates (effective December 1, 2025).
 *
 * Source: https://www.va.gov/disability/compensation-rates/veteran-rates/
 * Page "Last updated: November 2, 2026". Retrieved 2026-11-18.
 * Snapshot: docs/evidence/va-veteran-rates-2026-retrieved-2026-11-18.html
 *
 * All money values are INTEGER CENTS, copied cell-for-cell from the VA page.
 * src/test/rates-vs-snapshot.test.ts re-parses the snapshot and asserts every cell.
 * Do not edit by hand without updating the snapshot and docs/rate-sources.md.
 */
export const RATES_2026: RateTable = {
  year: 2026,
  status: 'official',
  effectiveDate: '2025-12-01',
  sourceUrl: 'https://www.va.gov/disability/compensation-rates/veteran-rates/',
  sourcePageLastUpdated: '2026-11-02',
  retrievedDate: '2026-11-18',
  low: { 10: 18042, 20: 35666 },
  household: {
    30: {
      alone: 55247, // Veteran alone (no dependents)
      spouse: 61747, // With spouse (no parents or children)
      spouse1p: 66947, // With spouse and 1 parent (no children)
      spouse2p: 72147, // With spouse and 2 parents (no children)
      p1: 60447, // With 1 parent (no spouse or children)
      p2: 65647, // With 2 parents (no spouse or children)
      child: 59647, // Veteran with 1 child only (no spouse or parents)
      childSpouse: 66647, // With 1 child and spouse (no parents)
      childSpouse1p: 71847, // With 1 child, spouse, and 1 parent
      childSpouse2p: 77047, // With 1 child, spouse, and 2 parents
      child1p: 64847, // With 1 child and 1 parent (no spouse)
      child2p: 70047, // With 1 child and 2 parents (no spouse)
      additionalChildUnder18: 3200,
      additionalSchoolChild: 10500,
      spouseAidAndAttendance: 6100,
    },
    40: {
      alone: 79584, // Veteran alone (no dependents)
      spouse: 88284, // With spouse (no parents or children)
      spouse1p: 95284, // With spouse and 1 parent (no children)
      spouse2p: 102284, // With spouse and 2 parents (no children)
      p1: 86584, // With 1 parent (no spouse or children)
      p2: 93584, // With 2 parents (no spouse or children)
      child: 85384, // Veteran with 1 child only (no spouse or parents)
      childSpouse: 94784, // With 1 child and spouse (no parents)
      childSpouse1p: 101784, // With 1 child, spouse, and 1 parent
      childSpouse2p: 108784, // With 1 child, spouse, and 2 parents
      child1p: 92384, // With 1 child and 1 parent (no spouse)
      child2p: 99384, // With 1 child and 2 parents (no spouse)
      additionalChildUnder18: 4300,
      additionalSchoolChild: 14000,
      spouseAidAndAttendance: 8100,
    },
    50: {
      alone: 113290, // Veteran alone (no dependents)
      spouse: 124190, // With spouse (no parents or children)
      spouse1p: 132990, // With spouse and 1 parent (no children)
      spouse2p: 141790, // With spouse and 2 parents (no children)
      p1: 122090, // With 1 parent (no spouse or children)
      p2: 130890, // With 2 parents (no spouse or children)
      child: 120590, // Veteran with 1 child only (no spouse or parents)
      childSpouse: 132290, // With 1 child and spouse (no parents)
      childSpouse1p: 141090, // With 1 child, spouse, and 1 parent
      childSpouse2p: 149890, // With 1 child, spouse, and 2 parents
      child1p: 129390, // With 1 child and 1 parent (no spouse)
      child2p: 138190, // With 1 child and 2 parents (no spouse)
      additionalChildUnder18: 5400,
      additionalSchoolChild: 17600,
      spouseAidAndAttendance: 10100,
    },
    60: {
      alone: 143502, // Veteran alone (no dependents)
      spouse: 156602, // With spouse (no parents or children)
      spouse1p: 167102, // With spouse and 1 parent (no children)
      spouse2p: 177602, // With spouse and 2 parents (no children)
      p1: 154002, // With 1 parent (no spouse or children)
      p2: 164502, // With 2 parents (no spouse or children)
      child: 152302, // Veteran with 1 child only (no spouse or parents)
      childSpouse: 166302, // With 1 child and spouse (no parents)
      childSpouse1p: 176802, // With 1 child, spouse, and 1 parent
      childSpouse2p: 187302, // With 1 child, spouse, and 2 parents
      child1p: 162802, // With 1 child and 1 parent (no spouse)
      child2p: 173302, // With 1 child and 2 parents (no spouse)
      additionalChildUnder18: 6500,
      additionalSchoolChild: 21100,
      spouseAidAndAttendance: 12100,
    },
    70: {
      alone: 180845, // Veteran alone (no dependents)
      spouse: 196145, // With spouse (no parents or children)
      spouse1p: 208445, // With spouse and 1 parent (no children)
      spouse2p: 220745, // With spouse and 2 parents (no children)
      p1: 193145, // With 1 parent (no spouse or children)
      p2: 205445, // With 2 parents (no spouse or children)
      child: 191045, // Veteran with child only (no spouse or parents)
      childSpouse: 207445, // With 1 child and spouse (no parents)
      childSpouse1p: 219745, // With 1 child, spouse and 1 parent
      childSpouse2p: 232045, // With 1 child, spouse and 2 parents
      child1p: 203345, // With 1 child and 1 parent
      child2p: 215645, // With 1 child and 2 parents (no spouse)
      additionalChildUnder18: 7600,
      additionalSchoolChild: 24600,
      spouseAidAndAttendance: 14100,
    },
    80: {
      alone: 210215, // Veteran alone (no dependents)
      spouse: 227715, // With spouse (no parents or children)
      spouse1p: 241715, // With spouse and 1 parent (no children)
      spouse2p: 255715, // With spouse and 2 parents (no children)
      p1: 224215, // With 1 parent (no spouse or children)
      p2: 238215, // With 2 parents (no spouse or children)
      child: 221915, // Veteran with child only (no spouse or parents)
      childSpouse: 240615, // With 1 child and spouse (no parents)
      childSpouse1p: 254615, // With 1 child, spouse and 1 parent
      childSpouse2p: 268615, // With 1 child, spouse and 2 parents
      child1p: 235915, // With 1 child and 1 parent
      child2p: 249915, // With 1 child and 2 parents (no spouse)
      additionalChildUnder18: 8700,
      additionalSchoolChild: 28100,
      spouseAidAndAttendance: 16100,
    },
    90: {
      alone: 236230, // Veteran alone (no dependents)
      spouse: 255930, // With spouse (no parents or children)
      spouse1p: 271730, // With spouse and 1 parent (no children)
      spouse2p: 287530, // With spouse and 2 parents (no children)
      p1: 252030, // With 1 parent (no spouse or children)
      p2: 267830, // With 2 parents (no spouse or children)
      child: 249430, // Veteran with child only (no spouse or parents)
      childSpouse: 270430, // With 1 child and spouse (no parents)
      childSpouse1p: 286230, // With 1 child, spouse and 1 parent
      childSpouse2p: 302030, // With 1 child, spouse and 2 parents
      child1p: 265230, // With 1 child and 1 parent
      child2p: 281030, // With 1 child and 2 parents (no spouse)
      additionalChildUnder18: 9800,
      additionalSchoolChild: 31700,
      spouseAidAndAttendance: 18100,
    },
    100: {
      alone: 393858, // Veteran alone (no dependents)
      spouse: 415817, // With spouse (no parents or children)
      spouse1p: 433441, // With spouse and 1 parent (no children)
      spouse2p: 451065, // With spouse and 2 parents (no children)
      p1: 411482, // With 1 parent (no spouse or children)
      p2: 429106, // With 2 parents (no spouse or children)
      child: 408543, // Veteran with child only (no spouse or parents)
      childSpouse: 431899, // With 1 child and spouse (no parents)
      childSpouse1p: 449523, // With 1 child, spouse and 1 parent
      childSpouse2p: 467147, // With 1 child, spouse and 2 parents
      child1p: 426167, // With 1 child and 1 parent
      child2p: 443791, // With 1 child and 2 parents (no spouse)
      additionalChildUnder18: 10911,
      additionalSchoolChild: 35245,
      spouseAidAndAttendance: 20141,
    },
  },
};
