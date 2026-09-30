import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(sourceDir, '..');
const background = '#0F172A';

// App Store icons must be opaque: flatten and drop the alpha channel entirely.
const targets = [
  { source: 'icon.svg', output: 'icon.png', size: 1024, opaque: true },
  { source: 'adaptive-icon.svg', output: 'adaptive-icon.png', size: 1024 },
  { source: 'splash-icon.svg', output: 'splash-icon.png', size: 1024 },
  { source: 'icon.svg', output: 'favicon.png', size: 48, opaque: true },
];

for (const { source, output, size, opaque } of targets) {
  const svg = await readFile(path.join(sourceDir, source));
  let image = sharp(svg).resize(size, size);
  if (opaque) {
    image = image.flatten({ background }).removeAlpha();
  }
  const info = await image.png({ compressionLevel: 9 }).toFile(path.join(assetsDir, output));
  console.log(`${output}: ${info.width}x${info.height}, ${info.channels} channels`);
}
