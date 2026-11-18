/**
 * Hero artwork.
 *
 * Six Black American service members — three men and three women of varied ages — one each
 * from the Army, Navy, Marine Corps, Air Force, Coast Guard, and Space Force, standing before
 * a large American flag. Fictional people (AI-generated). Reviewed 2026-11-18 against the
 * checklist in docs/hero-artwork.md. Master file: docs/assets/hero-master-1672x941.png.
 *
 * Files in public/hero/: `${basename}-{960,1600}.{webp,jpg}`.
 */
export interface HeroArt {
  /** Base path relative to the site base, without size/extension suffix. */
  basename: string;
  widths: readonly number[];
  /** Intrinsic aspect ratio (width / height) of the source. */
  width: number;
  height: number;
  alt: string;
  reviewed: boolean;
}

export const HERO_ART: HeroArt | null = {
  basename: 'hero/service-members',
  widths: [960, 1600],
  width: 1672,
  height: 941,
  alt: 'Six Black American service members, three men and three women, standing shoulder to shoulder before a large American flag in the dress uniforms of the Army, Navy, Marine Corps, Air Force, Coast Guard, and Space Force.',
  reviewed: true,
};
