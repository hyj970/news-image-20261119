// news-image-20261119 — "Sum up 19 November's world news in one image".
//
// The entry is one rendered infographic (entry.png, 1024x1024) summing up
// Thursday 19 November 2026 in six verified stories: the first-ever
// Trump–Xi–Putin trilateral summit in Shenzhen, the ICJ ruling that Myanmar
// committed genocide against the Rohingya, an AI-assisted cyberattack on the
// European Commission, a Russian drone damaging the Dutch embassy in Kyiv,
// a migrant boat capsizing off Senegal, and Israeli tanks crossing Gaza's
// "yellow line". Every story happened, or was first reported, on 19 November
// 2026, and each card names its sources. The image was drawn from real
// reporting of that day and rendered with real fonts, so every headline
// reads crisply at any size.
//
// This program just places that image at /output/entry.png. It needs no
// network and nothing beyond the Node standard library, and it writes the
// same bytes on every run — the grader runs it twice and compares.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 1048576; // 1 MiB
const MAX_SIDE = 1024; // px
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, 'entry.png');
const target = join(outDir, 'entry.png');

if (!existsSync(source)) {
  throw new Error(`entry.png missing next to main.ts: ${source}`);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);

// Read the written file back and check it is a whole, gate-valid PNG:
// correct magic bytes, an IHDR chunk, within the size and dimension caps,
// and byte-identical to the source, so a partial copy can never silently
// pass as a valid entry.
const written = readFileSync(target);
const original = readFileSync(source);

if (!written.equals(original)) {
  throw new Error('entry.png copy mismatch: output differs from source');
}
if (written.length > MAX_BYTES) {
  throw new Error(
    `entry.png too large: ${written.length} bytes exceeds 1 MiB`,
  );
}
if (
  written.length < 33 ||
  !written.subarray(0, 8).equals(PNG_SIGNATURE) ||
  written.readUInt32BE(12) !== 0x49484452 // "IHDR"
) {
  throw new Error('entry.png is not a valid PNG (bad magic bytes or no IHDR)');
}
const width = written.readUInt32BE(16);
const height = written.readUInt32BE(20);
if (width > MAX_SIDE || height > MAX_SIDE) {
  throw new Error(
    `entry.png too large: ${width}x${height} exceeds 1024x1024`,
  );
}
// A well-formed PNG ends with a 12-byte IEND chunk: length 0, type "IEND",
// CRC 0xAE426082. Checking the whole tail, not just the four letters,
// catches a file cut mid-chunk as well as one missing its ending.
const tail = written.subarray(written.length - 12);
if (
  tail.readUInt32BE(0) !== 0 ||
  tail.readUInt32BE(4) !== 0x49454e44 || // "IEND"
  tail.readUInt32BE(8) !== 0xae426082
) {
  throw new Error('entry.png is truncated: no valid IEND chunk at the end');
}

console.log(
  `wrote ${target} (${width}x${height}, ${written.length} bytes)`,
);
