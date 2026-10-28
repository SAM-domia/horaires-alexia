// Génère icon-180.png (cœur blanc sur dégradé rose-orange), sans dépendance.
import { writeFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';
const N = 180, raw = Buffer.alloc(N * (N * 3 + 1));
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const t = (x + y) / (2 * N), u = (x - 90) / 52, v = -(y - 98) / 52;
  const heart = (u * u + v * v - 1) ** 3 - u * u * v ** 3 <= 0;
  const c = heart ? [255, 255, 255] : [255, Math.round(70 + 90 * t), Math.round(110 - 60 * t)];
  c.forEach((k, i) => raw[y * (N * 3 + 1) + 1 + x * 3 + i] = k);
}
const chunk = (type, data) => { const b = Buffer.alloc(8 + data.length + 4); b.writeUInt32BE(data.length); b.write(type, 4); data.copy(b, 8); b.writeUInt32BE(crc32(b.subarray(4, 8 + data.length)), 8 + data.length); return b; };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 2;
writeFileSync('icon-180.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
