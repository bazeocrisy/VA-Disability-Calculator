import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Hero } from './components/Hero';
import { QuickPay, DEFAULT_HOUSEHOLD } from './components/QuickPay';
import { CombinedRating } from './components/CombinedRating';
import { HowItWorks } from './components/HowItWorks';
import { Sources } from './components/Sources';
import type { Household } from './lib/compensation';
import type { PayableRating } from './data/types';

const TABS = [
  { id: 'quick-pay', label: 'Quick Pay', heading: 'VA Compensation Calculator' },
  { id: 'combined-rating', label: 'Combined Rating', heading: 'Combined Disability Rating Calculator' },
  { id: 'how-it-works', label: 'How It Works', heading: 'Understand Your Benefits' },
  { id: 'sources', label: 'Sources', heading: 'Official Sources' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const tabFromHash = (): TabId => {
  const h = window.location.hash.slice(1);
  return (TABS.find((t) => t.id === h)?.id ?? 'quick-pay') as TabId;
};

export default function App() {
  const [tab, setTab] = useState<TabId>(tabFromHash);
  const [household, setHousehold] = useState<Household>(DEFAULT_HOUSEHOLD);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const toolsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const select = useCallback((id: TabId, opts: { scroll?: boolean; focus?: boolean } = {}) => {
    setTab(id);
    if (window.location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
    if (opts.scroll) {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      toolsRef.current?.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
    if (opts.focus) requestAnimationFrame(() => tabRefs.current[id]?.focus());
  }, []);

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next >= 0) {
      e.preventDefault();
      select(TABS[next].id, { focus: true });
    }
  };

  const applyRating = (rating: PayableRating) => {
    setHousehold((h) => ({ ...h, rating }));
    select('quick-pay', { scroll: true, focus: true });
  };

  const active = TABS.find((t) => t.id === tab)!;

  return (
    <>
      <a className="skip-link" href="#tools">
        Skip to calculators
      </a>
      <header className="site-header">
        <div className="container site-header__inner">
          <a className="brand" href="#quick-pay" aria-label="VeteranPay home">
            <svg className="brand__mark" viewBox="0 0 64 64" aria-hidden="true">
              <path d="M32 6l7.6 15.4 17 2.5-12.3 12 2.9 16.9L32 44.8 16.8 52.8l2.9-16.9-12.3-12 17-2.5z" fill="currentColor" />
            </svg>
            <span className="brand__name">
              Veteran<span>Pay</span>
            </span>
          </a>
          <nav aria-label="Primary">
            <ul className="site-nav">
              {TABS.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    aria-current={tab === t.id ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      select(t.id, { scroll: true });
                    }}
                  >
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <Hero
          onCompensation={() => select('quick-pay', { scroll: true, focus: true })}
          onCombined={() => select('combined-rating', { scroll: true, focus: true })}
        />

        <section className="intro container" aria-labelledby="intro-title">
          <h2 id="intro-title" className="visually-hidden">
            About VeteranPay
          </h2>
          <div className="intro__grid">
            <div className="intro__item">
              <span className="intro__num">2026</span>
              <p>Official VA rates, copied cell-for-cell from VA.gov</p>
            </div>
            <div className="intro__item">
              <span className="intro__num">2027</span>
              <p>Clearly labeled projections using the 3.6% COLA</p>
            </div>
            <div className="intro__item">
              <span className="intro__num">§ 4.25</span>
              <p>Combined ratings using VA’s official table and bilateral rules</p>
            </div>
            <div className="intro__item">
              <span className="intro__num">0</span>
              <p>Personal details collected. No accounts, no tracking.</p>
            </div>
          </div>
        </section>

        <section id="tools" ref={toolsRef} className="tools container" aria-label="Calculators and information" tabIndex={-1}>
          <div className="tablist" role="tablist" aria-label="VeteranPay sections">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => (tabRefs.current[t.id] = el)}
                id={`tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                className="tab"
                onClick={() => select(t.id)}
                onKeyDown={(e) => onTabKey(e, i)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div id={`panel-${active.id}`} role="tabpanel" aria-labelledby={`tab-${active.id}`} className="tabpanel" tabIndex={0}>
            <h2 className="section-title">{active.heading}</h2>
            {tab === 'quick-pay' && <QuickPay household={household} onChange={setHousehold} />}
            {tab === 'combined-rating' && <CombinedRating onUseRating={applyRating} />}
            {tab === 'how-it-works' && <HowItWorks />}
            {tab === 'sources' && <Sources />}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-stripes" aria-hidden="true" />
          <p className="site-footer__honor">
            <span aria-hidden="true">★</span> Honoring all who served — Army, Navy, Marine Corps, Air Force, Coast Guard,
            and Space Force. <span aria-hidden="true">★</span>
          </p>
          <p>
            VeteranPay is an independent veteran resource. Not affiliated with the U.S. Department of Veterans Affairs.
            Estimates are for information only; VA determines your official rating and payment.
          </p>
          <p>
            Need help with a claim? Contact VA at <a href="tel:18008271000">800-827-1000</a> or an accredited Veterans
            Service Officer. Veterans Crisis Line: dial <a href="tel:988">988</a> then press 1.
          </p>
        </div>
      </footer>
    </>
  );
}
