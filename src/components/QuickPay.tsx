import { useId, useMemo, useState } from 'react';
import { RATES_2026 } from '../data/rates2026';
import { COLA_2027 } from '../data/cola';
import { PAYABLE_RATINGS, type PayableRating } from '../data/types';
import { calculateCompensation, MAX_CHILDREN, type CompensationResult, type Household } from '../lib/compensation';
import { projectRateTable } from '../lib/projection';
import { formatCents, formatSignedCents } from '../lib/money';
import { buildSummary } from '../lib/summary';

export const RATES_2027_PROJECTED = projectRateTable(RATES_2026, COLA_2027);

export const DEFAULT_HOUSEHOLD: Household = {
  rating: 70,
  hasSpouse: false,
  spouseAidAndAttendance: false,
  dependentParents: 0,
  childrenUnder18: 0,
  schoolChildren: 0,
  receivesSMC: false,
};

interface Props {
  household: Household;
  onChange: (h: Household) => void;
}

function Stepper({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const clamp = (v: number) => Math.max(0, Math.min(MAX_CHILDREN, Number.isFinite(v) ? Math.trunc(v) : 0));
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      <div className="stepper">
        <button
          type="button"
          className="stepper__btn"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= 0}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          id={id}
          className="stepper__input"
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_CHILDREN}
          step={1}
          value={value}
          aria-describedby={hint ? hintId : undefined}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
        />
        <button
          type="button"
          className="stepper__btn"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= MAX_CHILDREN}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function ResultCard({ result, kind }: { result: CompensationResult; kind: 'official' | 'projected' }) {
  const title = kind === 'official' ? '2026 Official' : '2027 Projected';
  return (
    <article className={`result-card result-card--${kind}`} aria-labelledby={`card-${kind}`}>
      <header className="result-card__head">
        <h3 id={`card-${kind}`} className="result-card__title">
          {title}
        </h3>
        <span className={`badge badge--${kind}`}>{kind === 'official' ? 'Official VA rate' : 'PROJECTED'}</span>
      </header>
      <p className="result-card__meta">
        {kind === 'official'
          ? 'Effective Dec 1, 2025 · VA.gov table verified Nov 18, 2026'
          : `Estimate: 2026 rates + ${(COLA_2027.basisPoints / 100).toFixed(1)}% COLA · effective Dec 1, 2026 · not an official VA rate`}
      </p>
      {result.kind === 'ok' ? (
        <>
          <p className="result-card__amount">
            <span className="visually-hidden">Monthly: </span>
            {formatCents(result.monthly)}
            <span className="result-card__per">/month</span>
          </p>
          <p className="result-card__annual">
            {formatCents(result.annual)} <span>per year</span>
          </p>
          <details className="breakdown">
            <summary>Itemized breakdown</summary>
            <table>
              <caption className="visually-hidden">{title} itemized monthly breakdown</caption>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col" className="num">
                    Monthly
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.lines.map((l) => (
                  <tr key={l.label}>
                    <th scope="row">
                      {l.label}
                      <span className="breakdown__src">{l.source}</span>
                    </th>
                    <td className="num">{formatCents(l.cents)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total monthly</th>
                  <td className="num">{formatCents(result.monthly)}</td>
                </tr>
                <tr>
                  <th scope="row">Annual (× 12)</th>
                  <td className="num">{formatCents(result.annual)}</td>
                </tr>
              </tfoot>
            </table>
          </details>
        </>
      ) : result.kind === 'unsupported' ? (
        <div className="alert alert--warn" role="note">
          <strong>No estimate shown.</strong>
          <ul>
            {result.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="alert alert--error">
          <ul>
            {result.errors.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export function QuickPay({ household: h, onChange }: Props) {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const set = (patch: Partial<Household>) => {
    setCopied('idle');
    onChange({ ...h, ...patch });
  };
  const r2026 = useMemo(() => calculateCompensation(h, RATES_2026), [h]);
  const r2027 = useMemo(() => calculateCompensation(h, RATES_2027_PROJECTED), [h]);
  const both = r2026.kind === 'ok' && r2027.kind === 'ok';
  const diffMonthly = both ? r2027.monthly - r2026.monthly : 0;
  const lowRating = h.rating === 10 || h.rating === 20;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildSummary(h, r2026, r2027));
      setCopied('ok');
    } catch {
      setCopied('fail');
    }
  };

  return (
    <div className="calc">
      <form className="calc__form panel" onSubmit={(e) => e.preventDefault()} aria-label="Compensation inputs">
        <fieldset className="field">
          <legend className="field__label">Your VA disability rating</legend>
          <p className="field__hint">Your combined rating from VA (10% to 100%).</p>
          <div className="chips">
            {PAYABLE_RATINGS.map((r) => (
              <label key={r} className="chip">
                <input
                  type="radio"
                  name="rating"
                  value={r}
                  checked={h.rating === r}
                  onChange={() => set({ rating: r as PayableRating })}
                />
                <span>{r}%</span>
              </label>
            ))}
          </div>
        </fieldset>

        {lowRating && (
          <p className="alert alert--info" role="note">
            At 10% and 20%, VA does not pay more for a spouse, children, or parents. Dependent answers below won’t change
            your amount.
          </p>
        )}

        <fieldset className="field">
          <legend className="field__label">Are you married?</legend>
          <div className="segmented">
            {[
              { v: false, l: 'No spouse' },
              { v: true, l: 'Married' },
            ].map((o) => (
              <label key={String(o.v)} className="segmented__opt">
                <input
                  type="radio"
                  name="spouse"
                  checked={h.hasSpouse === o.v}
                  onChange={() => set({ hasSpouse: o.v, spouseAidAndAttendance: o.v ? h.spouseAidAndAttendance : false })}
                />
                <span>{o.l}</span>
              </label>
            ))}
          </div>
          {h.hasSpouse && (
            <label className="check">
              <input
                type="checkbox"
                checked={h.spouseAidAndAttendance}
                onChange={(e) => set({ spouseAidAndAttendance: e.target.checked })}
              />
              <span>
                My spouse receives <strong>Aid and Attendance</strong> (VA has approved it)
              </span>
            </label>
          )}
        </fieldset>

        <div className="field-row">
          <Stepper
            label="Children under 18"
            value={h.childrenUnder18}
            onChange={(v) => set({ childrenUnder18: v })}
          />
          <Stepper
            label="Children 18–23 in school"
            hint="In a VA-approved school program"
            value={h.schoolChildren}
            onChange={(v) => set({ schoolChildren: v })}
          />
        </div>

        <fieldset className="field">
          <legend className="field__label">Dependent parents</legend>
          <div className="segmented">
            {([0, 1, 2] as const).map((p) => (
              <label key={p} className="segmented__opt">
                <input
                  type="radio"
                  name="parents"
                  checked={h.dependentParents === p}
                  onChange={() => set({ dependentParents: p })}
                />
                <span>{p}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="field field--special">
          <legend className="field__label">Special situations</legend>
          <label className="check">
            <input type="checkbox" checked={!!h.receivesSMC} onChange={(e) => set({ receivesSMC: e.target.checked })} />
            <span>VA has awarded me Special Monthly Compensation (SMC)</span>
          </label>
          <p className="field__hint">
            <strong>TDIU:</strong> if VA has granted Total Disability based on Individual Unemployability, VA pays at the
            100% rate — select 100% only if VA has granted it. This calculator never assumes TDIU or SMC.
          </p>
        </fieldset>

        <div className="calc__actions">
          <button type="button" className="btn btn--secondary" onClick={() => onChange(DEFAULT_HOUSEHOLD)}>
            Reset calculator
          </button>
        </div>
      </form>

      <section className="calc__results" aria-labelledby="results-title">
        <h2 id="results-title" className="section-subtitle">
          Your estimated compensation at {h.rating}%
        </h2>
        <p className="visually-hidden" aria-live="polite">
          {r2026.kind === 'ok'
            ? `2026 official monthly amount ${formatCents(r2026.monthly)}.`
            : 'No estimate shown for this situation.'}
          {r2027.kind === 'ok' ? ` 2027 projected monthly amount ${formatCents(r2027.monthly)}.` : ''}
        </p>
        <div className="result-grid">
          <ResultCard result={r2026} kind="official" />
          <ResultCard result={r2027} kind="projected" />
        </div>

        {both && (
          <article className="cola-card" aria-labelledby="cola-title">
            <h3 id="cola-title">COLA difference (2027 projected − 2026 official)</h3>
            <dl>
              <div>
                <dt>Monthly</dt>
                <dd>{formatSignedCents(diffMonthly)}</dd>
              </div>
              <div>
                <dt>Annual</dt>
                <dd>{formatSignedCents(diffMonthly * 12)}</dd>
              </div>
              <div>
                <dt>COLA used</dt>
                <dd>{(COLA_2027.basisPoints / 100).toFixed(1)}%</dd>
              </div>
            </dl>
          </article>
        )}

        {r2026.kind === 'ok' && r2026.notes.length > 0 && (
          <ul className="notes">
            {r2026.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}

        <div className="projection-note" role="note">
          <strong>About 2027 figures:</strong> The Social Security Administration announced a{' '}
          {(COLA_2027.basisPoints / 100).toFixed(1)}% cost-of-living adjustment on October 14, 2026. VA is required by law
          to match it, but as of {COLA_2027.lastVerified} VA had not yet published its 2027 rate tables. 2027 amounts are{' '}
          <strong>projections</strong>, not official VA rates, and may differ slightly from what VA publishes.
        </div>

        <div className="calc__actions no-print">
          <button type="button" className="btn btn--secondary" onClick={copy}>
            Copy summary
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => {
              document.querySelectorAll('details.breakdown').forEach((d) => ((d as HTMLDetailsElement).open = true));
              window.print();
            }}>
            Print summary
          </button>
          <span className="copy-status" role="status">
            {copied === 'ok' ? 'Summary copied to clipboard.' : copied === 'fail' ? 'Copy failed — try Print instead.' : ''}
          </span>
        </div>
        <p className="fineprint">
          Estimates use VA’s published tables for your rating and household. VA determines your actual payment. Nothing
          you enter leaves your device.
        </p>
      </section>
    </div>
  );
}
