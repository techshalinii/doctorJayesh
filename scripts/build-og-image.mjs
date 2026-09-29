import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const data = fs.readFileSync(path.join(ROOT, "lib/data.ts"), "utf8");
const field = (key) => {
  const m = data.match(new RegExp(`\\n  ${key}: "([^"]+)"`));
  if (!m) throw new Error(`lib/data.ts: could not read "${key}"`);
  return m[1];
};

const NAME = field("name");
const CREDENTIALS = field("credentials");
const TITLE = field("title");
const CLINIC = data.match(/name: "(Fortis Hospital, Mulund)"/)?.[1];
if (!CLINIC) throw new Error("lib/data.ts: could not read the primary clinic name");

const W = 1200;
const H = 630;

const INK = "#341210";
const INK_2 = "#501d1c";
const ACCENT = "#e6928a";
const SOFT = "#f5ddda";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const FONT = "Segoe UI, Helvetica Neue, Arial, sans-serif";

const background = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${INK_2}"/>
      <stop offset="100%" stop-color="${INK}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1010" cy="120" r="300" fill="${ACCENT}" opacity="0.07"/>
  <rect x="0" y="${H - 10}" width="${W}" height="10" fill="${ACCENT}" opacity="0.85"/>
</svg>`);

const text = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <g font-family="${FONT}">
    <text x="80" y="196" font-size="23" font-weight="600" fill="${ACCENT}"
          letter-spacing="4.5">${esc(TITLE.toUpperCase())}</text>
    <text x="78" y="292" font-size="68" font-weight="700" fill="#ffffff">${esc(NAME)}</text>
    <text x="80" y="344" font-size="27" font-weight="400" fill="${SOFT}">${esc(CREDENTIALS)}</text>
    <rect x="80" y="392" width="86" height="3" fill="${ACCENT}" opacity="0.9"/>
    <text x="80" y="452" font-size="25" font-weight="400" fill="${SOFT}"
          opacity="0.92">${esc(CLINIC)} &#183; Mumbai</text>
  </g>
</svg>`);

const portrait = await sharp(path.join(ROOT, "public/images/Dr-Image1.png"))
  .resize({ width: 470, height: 560, fit: "inside" })
  .toBuffer();
const pMeta = await sharp(portrait).metadata();

const logo = await sharp(path.join(ROOT, "public/logo.png")).resize(74, 74).toBuffer();

await sharp(background)
  .composite([
    { input: portrait, left: W - pMeta.width - 62, top: H - pMeta.height - 10 },
    { input: logo, left: 80, top: 74 },
    { input: text, left: 0, top: 0 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(path.join(ROOT, "public/og-image.png"));

const { size } = fs.statSync(path.join(ROOT, "public/og-image.png"));
console.log(`public/og-image.png  ${W}x${H}  ${(size / 1024).toFixed(0)} KB`);
