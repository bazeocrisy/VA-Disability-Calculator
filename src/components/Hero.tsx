import { AmericanFlag } from './AmericanFlag';
import { HERO_ART } from '../heroArt';

export const BRANCHES = [
  { name: 'Army', full: 'United States Army', founded: 1775, accent: '#4B5320' },
  { name: 'Navy', full: 'United States Navy', founded: 1775, accent: '#1B2A4A' },
  { name: 'Marine Corps', full: 'United States Marine Corps', founded: 1775, accent: '#8B0000' },
  { name: 'Air Force', full: 'United States Air Force', founded: 1947, accent: '#00308F' },
  { name: 'Coast Guard', full: 'United States Coast Guard', founded: 1790, accent: '#C8102E' },
  { name: 'Space Force', full: 'United States Space Force', founded: 2019, accent: '#1C2541' },
] as const;

interface Props {
  onCompensation: () => void;
  onCombined: () => void;
}

export function Hero({ onCompensation, onCombined }: Props) {
  const art = HERO_ART && HERO_ART.reviewed ? HERO_ART : null;
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__flag" aria-hidden="true">
        <AmericanFlag className="hero__flag-svg" />
        <div className="hero__flag-light" />
      </div>
      <div className="hero__scrim" aria-hidden="true" />
      <div className="hero__inner container">
        <div className="hero__copy">
          <p className="eyebrow">
            <span className="eyebrow__star" aria-hidden="true">★</span> For America’s veterans and their families
          </p>
          <h1 id="hero-title" className="hero__title">
            You served.
            <br />
            <span className="hero__title-accent">You earned it.</span>
          </h1>
          <p className="hero__sub">
            Know Your Rating. Understand Your Benefits. Calculate Your Compensation.
          </p>
          <div className="hero__actions">
            <button type="button" className="btn btn--primary btn--lg" onClick={onCompensation}>
              Calculate My VA Compensation
            </button>
            <button type="button" className="btn btn--ghost btn--lg" onClick={onCombined}>
              Calculate My Combined Rating
            </button>
          </div>
          <p className="hero__disclaimer">
            Independent veteran resource. Not affiliated with the U.S. Department of Veterans Affairs.
          </p>
        </div>

        <figure className={`hero__art ${art ? '' : 'hero__art--placeholder'}`}>
          {art ? (
            <picture>
              {(['webp', 'jpg'] as const).map((ext) => (
                <source
                  key={ext}
                  type={ext === 'webp' ? 'image/webp' : 'image/jpeg'}
                  srcSet={art.widths.map((w) => `${import.meta.env.BASE_URL}${art.basename}-${w}.${ext} ${w}w`).join(', ')}
                  sizes="(min-width: 1200px) 560px, (min-width: 980px) 46vw, calc(100vw - 32px)"
                />
              ))}
              <img
                src={`${import.meta.env.BASE_URL}${art.basename}-${art.widths[0]}.jpg`}
                alt={art.alt}
                width={art.width}
                height={art.height}
                // React 18 does not know the camelCase prop; the lowercase HTML attribute is passed through as-is.
                {...{ fetchpriority: 'high' }}
                decoding="async"
              />
            </picture>
          ) : (
            <div className="art-placeholder" role="img" aria-label="Placeholder for hero artwork: six Black American service members, one from each of the six military branches, standing together before the American flag. Final artwork pending review.">
              <AmericanFlag className="art-placeholder__flag" waving={false} />
              <div className="art-placeholder__label">
                <span className="art-placeholder__tag">Artwork placeholder</span>
                <span>
                  Six Black service members — Army, Navy, Marine Corps, Air Force, Coast Guard, Space Force — united
                  before the flag.
                </span>
                <span className="art-placeholder__small">Final image pending accuracy review.</span>
              </div>
            </div>
          )}
        </figure>
      </div>

      <div className="branches container" role="list" aria-label="The six branches of the U.S. Armed Forces">
        {BRANCHES.map((b) => (
          <div key={b.name} role="listitem" className="branch" style={{ ['--branch' as string]: b.accent }}>
            <span className="branch__star" aria-hidden="true">★</span>
            <span className="branch__name">{b.name}</span>
            <span className="branch__year">
              <span className="visually-hidden">{b.full}, established </span>Est. {b.founded}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
