import { useMemo, useRef, useState } from 'react';
import { calculateCombinedRating, type Condition, type Extremity, type Side } from '../lib/combined';
import type { PayableRating } from '../data/types';

const RATING_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const LOCATION_OPTIONS: { value: string; label: string; extremity?: Extremity; side?: Side }[] = [
  { value: 'none', label: 'Not an arm or leg' },
  { value: 'arm-left', label: 'Left arm (upper extremity)', extremity: 'arm', side: 'left' },
  { value: 'arm-right', label: 'Right arm (upper extremity)', extremity: 'arm', side: 'right' },
  { value: 'leg-left', label: 'Left leg (lower extremity)', extremity: 'leg', side: 'left' },
  { value: 'leg-right', label: 'Right leg (lower extremity)', extremity: 'leg', side: 'right' },
];

let nextId = 1;
const newCondition = (rating = 10): Condition => ({ id: `c${nextId++}`, rating });

interface Props {
  onUseRating: (rating: PayableRating) => void;
}

export function CombinedRating({ onUseRating }: Props) {
  const [conditions, setConditions] = useState<Condition[]>(() => [newCondition(50), newCondition(30), newCondition(20)]);
  const listRef = useRef<HTMLOListElement>(null);
  const result = useMemo(() => calculateCombinedRating(conditions), [conditions]);

  const update = (id: string, patch: Partial<Condition>) =>
    setConditions((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const add = () => {
    setConditions((cs) => [...cs, newCondition(10)]);
    requestAnimationFrame(() => {
      const selects = listRef.current?.querySelectorAll<HTMLSelectElement>('select[data-rating]');
      selects?.[selects.length - 1]?.focus();
    });
  };
  const remove = (id: string, index: number) => {
    setConditions((cs) => cs.filter((c) => c.id !== id));
    requestAnimationFrame(() => {
      const selects = listRef.current?.querySelectorAll<HTMLSelectElement>('select[data-rating]');
      const target = selects?.[Math.max(0, index - 1)];
      (target ?? document.getElementById('add-condition'))?.focus();
    });
  };

  const payable = result.finalRating >= 10 ? (result.finalRating as PayableRating) : null;
  const excluded = new Set(result.excludedFromBilateral);

  return (
    <div className="calc">
      <form className="calc__form panel" onSubmit={(e) => e.preventDefault()} aria-label="Individual disability ratings">
        <p className="field__hint">
          Enter each service-connected condition’s rating from your VA decision letter. If a condition affects an arm or
          leg, choose which one — VA may add a <strong>bilateral factor</strong> when both arms or both legs are rated.
        </p>
        <ol className="conditions" ref={listRef}>
          {conditions.map((c, i) => {
            const loc = c.extremity ? `${c.extremity}-${c.side}` : 'none';
            return (
              <li key={c.id} className="condition">
                <span className="condition__num" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="condition__fields">
                  <label className="field">
                    <span className="field__label">Condition {i + 1} rating</span>
                    <select
                      data-rating
                      value={c.rating}
                      onChange={(e) => update(c.id, { rating: Number(e.target.value) })}
                    >
                      {RATING_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}%
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="field__label">Condition {i + 1} location</span>
                    <select
                      value={loc}
                      onChange={(e) => {
                        const o = LOCATION_OPTIONS.find((x) => x.value === e.target.value)!;
                        update(c.id, { extremity: o.extremity, side: o.side });
                      }}
                    >
                      {LOCATION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {excluded.has(c.id) && (
                    <p className="condition__flag">Combined separately (§ 4.26(d) — more favorable)</p>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn--icon"
                  onClick={() => remove(c.id, i)}
                  aria-label={`Remove condition ${i + 1} (${c.rating}%)`}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ol>
        <div className="calc__actions">
          <button id="add-condition" type="button" className="btn btn--primary" onClick={add} disabled={conditions.length >= 20}>
            + Add a condition
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => setConditions([])}>
            Clear all
          </button>
        </div>
        <p className="fineprint">
          Not supported: bilateral factor for paired skeletal muscles other than the arms and legs, and VA rules that limit
          ratings for a single body part (amputation rule, 38 CFR 4.68). VA decides your official combined rating.
        </p>
      </form>

      <section className="calc__results" aria-labelledby="combined-title">
        <h2 id="combined-title" className="section-subtitle">
          Your combined rating
        </h2>
        {result.errors.length > 0 ? (
          <div className="alert alert--error">
            <ul>
              {result.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ) : conditions.length === 0 ? (
          <p className="alert alert--info">Add at least one condition to see your combined rating.</p>
        ) : (
          <>
            <div className="combined-hero" aria-live="polite">
              <div className="combined-hero__ring">
                <span className="combined-hero__value">{result.finalRating}%</span>
                <span className="combined-hero__label">VA combined rating</span>
              </div>
              <dl className="combined-hero__facts">
                <div>
                  <dt>Exact combined value</dt>
                  <dd>{result.combinedValue}</dd>
                </div>
                <div>
                  <dt>Simple sum (not how VA does it)</dt>
                  <dd>{Math.min(conditions.reduce((s, c) => s + c.rating, 0), 999)}%</dd>
                </div>
                <div>
                  <dt>Bilateral factor</dt>
                  <dd>{result.bilateralApplied ? `Applied (${result.bilateralValue})` : 'Not applicable'}</dd>
                </div>
              </dl>
            </div>
            <h3 className="steps-title">Step-by-step (38 CFR §§ 4.25–4.26)</h3>
            <ol className="steps">
              {result.steps.map((s, i) => (
                <li key={i} className={`step step--${s.kind}`}>
                  {s.text}
                </li>
              ))}
            </ol>
            {payable ? (
              <button type="button" className="btn btn--primary" onClick={() => onUseRating(payable)}>
                Use {payable}% in the compensation calculator
              </button>
            ) : (
              <p className="alert alert--info">
                A combined rating of 0% is not paid monthly compensation.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
