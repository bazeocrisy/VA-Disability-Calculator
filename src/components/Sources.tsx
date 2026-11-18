import { RATES_2026 } from '../data/rates2026';
import { COLA_2027 } from '../data/cola';

const SOURCES = [
  {
    group: 'VA compensation rates',
    links: [
      { href: 'https://www.va.gov/disability/compensation-rates/veteran-rates/', label: 'VA.gov — Current Veterans disability compensation rates' },
      { href: 'https://www.va.gov/disability/compensation-rates/special-monthly-compensation-rates/', label: 'VA.gov — Special monthly compensation (SMC) rates' },
      { href: 'https://www.va.gov/disability/about-disability-ratings/', label: 'VA.gov — About disability ratings' },
      { href: 'https://www.va.gov/disability/eligibility/special-claims/unemployability/', label: 'VA.gov — Individual Unemployability (TDIU)' },
    ],
  },
  {
    group: 'Federal regulations',
    links: [
      { href: 'https://www.ecfr.gov/current/title-38/chapter-I/part-4/subpart-A/section-4.25', label: '38 CFR § 4.25 — Combined ratings table' },
      { href: 'https://www.ecfr.gov/current/title-38/chapter-I/part-4/subpart-A/section-4.26', label: '38 CFR § 4.26 — Bilateral factor' },
    ],
  },
  {
    group: 'Cost-of-living adjustment',
    links: [
      { href: COLA_2027.sourceUrl, label: 'SSA — Social Security Announces 3.6 Percent Benefit Increase for 2027 (Oct 14, 2026)' },
      { href: 'https://www.ssa.gov/news/en/cola/index.html', label: 'SSA — Cost-of-Living Adjustment (COLA) information' },
      { href: 'https://www.congress.gov/bill/119th-congress/senate-bill/4487', label: 'Congress.gov — S. 4487, Veterans’ Compensation Cost-of-Living Adjustment Act of 2026' },
    ],
  },
];

export function Sources() {
  return (
    <div className="sources">
      <div className="verify-grid">
        <div className="verify">
          <span className="badge badge--official">Official</span>
          <h3>2026 VA rates</h3>
          <p>
            Effective December 1, 2025. Every one of the 122 published cells was copied from VA.gov (page last updated
            November 2, 2026) and checked against a saved copy of the page on {RATES_2026.retrievedDate}.
          </p>
        </div>
        <div className="verify">
          <span className="badge badge--projected">Projected</span>
          <h3>2027 estimates</h3>
          <p>
            2026 rates × {(COLA_2027.basisPoints / 100).toFixed(1)}% Social Security COLA (announced October 14, 2026).
            VA had not published 2027 tables when last verified on {COLA_2027.lastVerified}.
          </p>
        </div>
      </div>
      {SOURCES.map((s) => (
        <section key={s.group} className="source-group" aria-label={s.group}>
          <h3>{s.group}</h3>
          <ul>
            {s.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="source-group" aria-label="Privacy">
        <h3>Your privacy</h3>
        <p>
          VeteranPay has no accounts, no analytics, no cookies, and no server. Everything you enter stays in your browser
          and disappears when you close the page. We never ask for your name, Social Security number, claim number, or
          medical records.
        </p>
      </section>
    </div>
  );
}
