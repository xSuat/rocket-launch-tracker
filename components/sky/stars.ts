export const STAR_SEED = 0xc0ffee;

export interface Star {
  x: number;
  y: number;
  r: number;
  o: number;
  twinkle: boolean;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RADII = [0.6, 0.8, 1.1, 1.6];
const OPACITIES = [0.28, 0.45, 0.7, 0.92];

const MOON_X = 370 / 390;
const MOON_Y = 28 / 844;
const MOON_R = 18 / 390;

export function createStarfield(seed = STAR_SEED): Star[] {
  const rand = mulberry32(seed);
  const stars: Star[] = [];
  while (stars.length < 56) {
    const x = rand();
    const y = rand();
    const dx = x - MOON_X;
    const dy = y - MOON_Y;
    if (dx * dx + dy * dy < MOON_R * MOON_R) continue;
    const i = Math.floor(rand() * 4);
    stars.push({
      x,
      y,
      r: RADII[i],
      o: OPACITIES[i],
      twinkle: false,
    });
  }
  let n = 0;
  for (let i = 0; i < stars.length && n < 5; i++) {
    if (i % 11 === 0) {
      stars[i].twinkle = true;
      stars[i].o = 0.9;
      n++;
    }
  }
  return stars;
}
