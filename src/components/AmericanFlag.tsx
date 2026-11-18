/**
 * U.S. flag drawn to the proportions in Executive Order 10834:
 * hoist A = 1.0, fly B = 1.9, union C = 7/13, union width D = 0.76,
 * star rows E = F = 0.054, star columns G = H = 0.063, star diameter K = 0.0616.
 * 13 stripes (7 red, 6 white), 50 five-pointed stars in 9 alternating rows of 6 and 5.
 *
 * Units here: hoist = 1000.
 */
const A = 1000;
const B = 1900;
const STRIPE = A / 13;
const C = STRIPE * 7;
const D = 760;
const E = 54;
const G = 63;
const K = 61.6;

const RED = '#B22234';
const WHITE = '#FFFFFF';
const BLUE = '#3C3B6E';

function starPath(cx: number, cy: number, r: number): string {
  const inner = r * 0.381966; // regular five-pointed star
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rad * Math.cos(angle)).toFixed(2)},${(cy + rad * Math.sin(angle)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

const STARS: string = (() => {
  const paths: string[] = [];
  for (let row = 1; row <= 9; row++) {
    const y = E * row; // F (row spacing) equals E (first-row offset)
    const cols = row % 2 === 1 ? [1, 3, 5, 7, 9, 11] : [2, 4, 6, 8, 10];
    for (const col of cols) paths.push(starPath(G * col, y, K / 2));
  }
  return paths.join('');
})();

export const FLAG_STAR_COUNT = (STARS.match(/M/g) ?? []).length;
export const FLAG_GEOMETRY = { A, B, C, D, E, G, K, STRIPE } as const;

interface Props {
  className?: string;
  /** Adds the displacement "wave" shape and moving light. Motion respects prefers-reduced-motion in CSS. */
  waving?: boolean;
  title?: string;
}

export function AmericanFlag({ className, waving = true, title }: Props) {
  const filterId = 'flag-wave';
  return (
    <svg
      className={className}
      viewBox={`0 0 ${B} ${A}`}
      preserveAspectRatio="xMidYMid slice"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <defs>
        {waving && (
          <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.0016 0.0007" numOctaves="1" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="70" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        )}
        <linearGradient id="flag-shade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.18" stopColor="#fff" stopOpacity="0.10" />
          <stop offset="0.36" stopColor="#000" stopOpacity="0.22" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.74" stopColor="#000" stopOpacity="0.24" />
          <stop offset="0.9" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <g filter={waving ? `url(#${filterId})` : undefined}>
        <rect width={B} height={A} fill={WHITE} />
        {Array.from({ length: 13 }, (_, i) =>
          i % 2 === 0 ? <rect key={i} y={i * STRIPE} width={B} height={STRIPE + 0.5} fill={RED} /> : null,
        )}
        <rect width={D} height={C} fill={BLUE} />
        <path d={STARS} fill={WHITE} />
        <rect className="flag-shade" width={B} height={A} fill="url(#flag-shade)" />
      </g>
    </svg>
  );
}
