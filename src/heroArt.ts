/**
 * Hero artwork slot.
 *
 * Required asset (see docs/hero-artwork.md for the full brief):
 *  Cinematic group portrait of six Black American service members — Black men and women of
 *  varied ages and appearances — one each from the Army, Navy, Marine Corps, Air Force,
 *  Coast Guard, and Space Force, in branch-correct uniforms, standing together before a
 *  large American flag with dramatic lighting. Fictional people only; no real individuals.
 *
 * The page shows a clearly labeled placeholder until an asset has been generated AND a
 * human has reviewed it for uniform/insignia accuracy and dignity. Then set:
 *   export const HERO_ART = { src: 'hero/service-members.jpg', alt: '…', reviewed: true };
 * with the file placed at public/hero/service-members.jpg (2400px wide, < 400 KB JPG/WebP).
 */
export interface HeroArt {
  /** Path relative to the site base (public/ folder). */
  src: string;
  alt: string;
  reviewed: boolean;
}

export const HERO_ART: HeroArt | null = null;
