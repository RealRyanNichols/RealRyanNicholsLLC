import sharp from "sharp";

// Quiet Authority mark: cream field, navy serif RN, one gold rule.
// Regenerates every icon the site + PWA manifest reference.
const svg = (s) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#fdf8ea"/>
  <rect x="24" y="24" width="464" height="464" rx="80" fill="none" stroke="#0b1b34" stroke-width="14"/>
  <text x="256" y="300" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="220" font-weight="700" fill="#0b1b34" letter-spacing="-6">RN</text>
  <rect x="166" y="360" width="180" height="18" fill="#e1bd5b"/>
</svg>`;

const jobs = [
  ["public/icons/icon-512.png", 512],
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-180.png", 180],
  ["app/icon.png", 64],
  ["app/apple-icon.png", 180],
];

for (const [out, size] of jobs) {
  await sharp(Buffer.from(svg(size)))
    .resize(size, size)
    .png()
    .toFile(out);
  console.log("wrote", out, size);
}
