import { describe, expect, it } from 'vitest';
import {
  applyBilateralFactor,
  calculateCombinedRating,
  combinePair,
  roundToNearestTen,
  type Condition,
} from '../lib/combined';
import { TABLE_I } from '../data/combinedRatingsTable';
import { loadTableI } from './snapshot';

let id = 0;
const c = (rating: number, extremity?: 'arm' | 'leg', side?: 'left' | 'right'): Condition => ({
  id: `t${id++}`,
  rating,
  extremity,
  side,
});
const final = (...cs: Condition[]) => calculateCombinedRating(cs).finalRating;

describe('38 CFR § 4.25 Table I', () => {
  const official = loadTableI();
  it('stored table equals the saved eCFR table (684 cells)', () => {
    expect(official.size).toBe(684);
    for (const [key, v] of official) {
      const [a, b] = key.split('|').map(Number);
      expect(TABLE_I[a][b / 10 - 1], key).toBe(v);
    }
  });
  it('every printed cell equals the efficiency method rounded half-up', () => {
    for (const [key, v] of official) {
      const [a, b] = key.split('|').map(Number);
      expect(Math.floor((100 * a + b * (100 - a) + 50) / 100), key).toBe(v);
      expect(combinePair(a, b)).toEqual({ value: v, viaTable: true });
    }
  });
  it('regulation examples', () => {
    expect(combinePair(60, 30).value).toBe(72); // § 4.25 intro
    expect(combinePair(50, 30).value).toBe(65);
    expect(combinePair(40, 20).value).toBe(52);
    expect(combinePair(60, 40).value).toBe(76);
    expect(combinePair(76, 20).value).toBe(81);
  });
});

describe('§ 4.25(a) combination and rounding', () => {
  it('50 + 30 + 20 → 70 (not 100)', () => {
    const r = calculateCombinedRating([c(50), c(30), c(20)]);
    expect(r.combinedValue).toBe(72);
    expect(r.finalRating).toBe(70);
  });
  it('regulation examples: 50+30 → 70, 40+20 → 50, 60+40+20 → 80', () => {
    expect(final(c(50), c(30))).toBe(70);
    expect(final(c(40), c(20))).toBe(50);
    const r = calculateCombinedRating([c(60), c(40), c(20)]);
    expect(r.combinedValue).toBe(81);
    expect(r.finalRating).toBe(80);
  });
  it('uses the exact intermediate value, not a rounded one', () => {
    // 50+30 = 65 (not 70); 65 with 20 = 72 → 70. Rounding early would give 70+20 → 76 → 80.
    expect(final(c(50), c(30), c(20))).toBe(70);
  });
  it('rounding boundaries: 5s go up, 4s go down, capped at 100', () => {
    expect(roundToNearestTen(44)).toBe(40);
    expect(roundToNearestTen(45)).toBe(50);
    expect(roundToNearestTen(94)).toBe(90);
    expect(roundToNearestTen(95)).toBe(100);
    expect(roundToNearestTen(4)).toBe(0);
    expect(roundToNearestTen(5)).toBe(10);
    expect(final(c(30), c(30))).toBe(50); // 51 → 50
    expect(final(c(30), c(20))).toBe(40); // 44 → 40
    expect(final(c(40), c(10))).toBe(50); // 46 → 50
    expect(final(c(10), c(10))).toBe(20); // 19 → 20
    expect(final(c(70), c(50))).toBe(90); // 85 → 90
  });
  it('100% anywhere → 100; 0% conditions add nothing', () => {
    expect(final(c(100), c(10))).toBe(100);
    expect(final(c(0), c(0))).toBe(0);
    expect(final(c(30), c(0))).toBe(30);
  });
  it('order of entry never matters', () => {
    const sets = [
      [50, 30, 20],
      [10, 10, 10, 10, 10],
      [70, 40, 30, 20, 10, 10],
      [90, 60, 30, 10],
    ];
    for (const s of sets) {
      const ref = calculateCombinedRating(s.map((r) => c(r)));
      for (let k = 0; k < 20; k++) {
        const shuffled = [...s].sort(() => Math.random() - 0.5);
        const r = calculateCombinedRating(shuffled.map((x) => c(x)));
        expect(r.combinedValue).toBe(ref.combinedValue);
        expect(r.finalRating).toBe(ref.finalRating);
      }
    }
  });
  it('rejects invalid input', () => {
    expect(calculateCombinedRating([c(110)]).errors.length).toBeGreaterThan(0);
    expect(calculateCombinedRating([c(-10)]).errors.length).toBeGreaterThan(0);
    expect(calculateCombinedRating([c(15)]).errors.length).toBeGreaterThan(0);
    expect(calculateCombinedRating([{ id: 'x', rating: 10, extremity: 'arm' }]).errors.length).toBeGreaterThan(0);
  });
});

describe('§ 4.26 bilateral factor', () => {
  it('regulation example: 60, 20, and bilateral 10/10 → order 60, 21, 20 → 68 → 74 → 70', () => {
    const r = calculateCombinedRating([c(60), c(20), c(10, 'leg', 'left'), c(10, 'leg', 'right')]);
    expect(r.bilateralApplied).toBe(true);
    expect(r.bilateralValue).toBe(21);
    expect(r.combinedValue).toBe(74);
    expect(r.finalRating).toBe(70);
    expect(r.steps.map((s) => s.value)).toEqual([10, 19, 21, 60, 68, 74, 70]);
  });
  it('adds (not combines) 10% and rounds half-up', () => {
    expect(applyBilateralFactor(19)).toBe(21); // 20.9
    expect(applyBilateralFactor(25)).toBe(28); // 27.5 → 28
    expect(applyBilateralFactor(24)).toBe(26); // 26.4 → 26
    expect(applyBilateralFactor(30)).toBe(33);
    expect(applyBilateralFactor(95)).toBe(100); // capped
  });
  it('bilateral factor can raise the final rating', () => {
    // 30/30 knees: 51 → 56.1 → 56 → 60 (without factor: 51 → 50)
    expect(final(c(30, 'leg', 'left'), c(30, 'leg', 'right'))).toBe(60);
    expect(final(c(30), c(30))).toBe(50);
  });
  it('§ 4.26(c): not applicable without compensable disability on both sides', () => {
    expect(calculateCombinedRating([c(20, 'arm', 'left'), c(10, 'arm', 'left')]).bilateralApplied).toBe(false);
    expect(calculateCombinedRating([c(20, 'arm', 'left'), c(0, 'arm', 'right')]).bilateralApplied).toBe(false);
    // left arm + right leg are not a pair
    expect(calculateCombinedRating([c(20, 'arm', 'left'), c(20, 'leg', 'right')]).bilateralApplied).toBe(false);
  });
  it('§ 4.26(a): all disabilities of a qualifying pair join the bilateral group', () => {
    const r = calculateCombinedRating([c(20, 'leg', 'left'), c(10, 'leg', 'left'), c(10, 'leg', 'right'), c(40)]);
    // group 20,10,10: 20→28→35, +3.5 = 38.5 → 39; then 40 with 39 → 63 → 60
    expect(r.bilateralValue).toBe(39);
    expect(r.combinedValue).toBe(63);
    expect(r.finalRating).toBe(60);
  });
  it('§ 4.26(b): four extremities combine in one group with one factor', () => {
    const r = calculateCombinedRating([
      c(20, 'arm', 'left'),
      c(20, 'arm', 'right'),
      c(10, 'leg', 'left'),
      c(10, 'leg', 'right'),
    ]);
    // 20,20 → 36; 36,10 → 42; 42,10 → 48; +4.8 = 52.8 → 53 → 50
    expect(r.bilateralValue).toBe(53);
    expect(r.finalRating).toBe(50);
    expect(r.steps.filter((s) => s.kind === 'bilateral-factor')).toHaveLength(1);
  });
  it('§ 4.26(d): removes bilateral disabilities when that is more favorable', () => {
    // With factor: 10/10 legs → 21; 90, 30, 21 → 93 → 94 → 90.
    // Without:    90, 30, 10, 10 → 93 → 94 → 95 → 100.
    const cs = [c(10, 'leg', 'left'), c(10, 'leg', 'right'), c(90), c(30)];
    const r = calculateCombinedRating(cs);
    expect(r.finalRating).toBe(100);
    expect(r.excludedFromBilateral.length).toBeGreaterThan(0);
    expect(r.steps.some((s) => s.kind === 'note' && /4\.26\(d\)/.test(s.text))).toBe(true);
  });
  it('never returns less than either the standard or the no-bilateral result', () => {
    const R = [10, 20, 30, 40, 50, 60, 70, 80, 90];
    const seq = (v: number[]) => [...v].sort((a, b) => b - a).reduce((a, b) => combinePair(a, b).value);
    for (const l of R)
      for (const rr of R)
        for (const o of [0, ...R]) {
          const others = o ? [o] : [];
          const std = roundToNearestTen(seq([applyBilateralFactor(seq([l, rr])), ...others]));
          const none = roundToNearestTen(seq([l, rr, ...others]));
          const got = final(c(l, 'arm', 'left'), c(rr, 'arm', 'right'), ...others.map((x) => c(x)));
          expect(got).toBe(Math.max(std, none));
        }
  });
  it('§ 4.26(d) still applies with a 13-condition bilateral group (audit finding D1)', () => {
    // Independent auditor's case: code previously skipped the search above 12 and returned 90%.
    const cs = [
      ...[10, 10, 20].map((r) => c(r, 'arm', 'left')),
      ...[10, 10, 10, 20].map((r) => c(r, 'arm', 'right')),
      ...[20, 10].map((r) => c(r, 'leg', 'left')),
      ...[10, 10, 10, 10].map((r) => c(r, 'leg', 'right')),
      c(20),
      c(30),
    ];
    const t0 = performance.now();
    const r = calculateCombinedRating(cs);
    expect(r.errors).toEqual([]);
    expect(r.finalRating).toBe(100);
    expect(r.excludedFromBilateral.length).toBeGreaterThan(0);
    expect(performance.now() - t0).toBeLessThan(2000);
  });
  it('refuses (no number) when the bilateral group exceeds the exhaustive-search limit', () => {
    const cs = Array.from({ length: 17 }, (_, i) => c(10, 'leg', i % 2 ? 'left' : 'right'));
    const r = calculateCombinedRating(cs);
    expect(r.errors.length).toBe(1);
    expect(r.finalRating).toBe(0);
    expect(r.steps).toEqual([]);
  });
  it('16-condition bilateral group completes quickly', () => {
    const cs = Array.from({ length: 16 }, (_, i) => c(10 + (i % 3) * 10, i < 8 ? 'arm' : 'leg', i % 2 ? 'left' : 'right'));
    const t0 = performance.now();
    expect(calculateCombinedRating(cs).errors).toEqual([]);
    console.log('16-member search ms:', Math.round(performance.now() - t0));
  });
});
