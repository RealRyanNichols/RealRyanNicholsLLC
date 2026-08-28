import sharp from "sharp";
import chunk0 from "@/lib/evidence/mike-jones-sprite/chunk0";
import chunk1 from "@/lib/evidence/mike-jones-sprite/chunk1";
import chunk2 from "@/lib/evidence/mike-jones-sprite/chunk2";
import chunk3a from "@/lib/evidence/mike-jones-sprite/chunk3a";
import chunk3b from "@/lib/evidence/mike-jones-sprite/chunk3b";
import chunk4 from "@/lib/evidence/mike-jones-sprite/chunk4";
import chunk5 from "@/lib/evidence/mike-jones-sprite/chunk5";
import chunk6 from "@/lib/evidence/mike-jones-sprite/chunk6";
import chunk7 from "@/lib/evidence/mike-jones-sprite/chunk7";

const encoded = chunk0 + chunk1 + chunk2 + chunk3a + chunk3b + chunk4 + chunk5 + chunk6 + chunk7;
const sprite = Buffer.from(encoded, "base64");

function round(value: number) {
  return Math.round(value);
}

function svgBuffer(value: string) {
  return Buffer.from(value);
}

export async function renderMikeJonesFacebookReportOg(width: number, height: number) {
  const scale = width / 1200;
  const s = (value: number) => round(value * scale);

  const shotX = s(46);
  const shotY = s(53);
  const shotW = s(430);
  const shotH = s(524);
  const radius = s(22);
  const border = Math.max(2, s(4));

  const receipt = await sharp(sprite)
    .extract({ left: 0, top: 0, width: 500, height: 609 })
    .resize({ width: shotW, height: shotH, fit: "cover" })
    .png()
    .toBuffer();

  const mask = svgBuffer(
    `<svg width="${shotW}" height="${shotH}" xmlns="http://www.w3.org/2000/svg"><rect width="${shotW}" height="${shotH}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`,
  );

  const roundedReceipt = await sharp(receipt)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const font = "DejaVu Sans, Liberation Sans, Arial, sans-serif";
  const rightX = s(525);
  const rightW = s(625);

  const background = svgBuffer(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#050d1c"/>
          <stop offset="0.52" stop-color="#0b1b34"/>
          <stop offset="1" stop-color="#17345d"/>
        </linearGradient>
        <radialGradient id="glow" cx="86%" cy="12%" r="72%">
          <stop offset="0" stop-color="#e1bd5b" stop-opacity="0.24"/>
          <stop offset="0.42" stop-color="#e1bd5b" stop-opacity="0.05"/>
          <stop offset="1" stop-color="#e1bd5b" stop-opacity="0"/>
        </radialGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="${s(18)}" stdDeviation="${s(18)}" flood-color="#000" flood-opacity="0.55"/>
        </filter>
      </defs>

      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <rect width="${width}" height="${height}" fill="url(#glow)"/>
      <path d="M ${s(470)} 0 L ${s(705)} 0 L ${s(475)} ${height} L ${s(245)} ${height} Z" fill="#ffffff" opacity="0.025"/>

      <rect x="${shotX - border}" y="${shotY - border}" width="${shotW + border * 2}" height="${shotH + border * 2}" rx="${radius + border}" fill="#e1bd5b" filter="url(#shadow)"/>

      <rect x="${rightX}" y="${s(47)}" width="${s(326)}" height="${s(33)}" rx="${s(16)}" fill="#e1bd5b"/>
      <text x="${rightX + s(18)}" y="${s(69)}" fill="#061023" font-family="${font}" font-size="${s(15)}" font-weight="900" letter-spacing="${s(1.4)}">SCREENSHOT-BACKED PUBLIC RECORD</text>

      <text x="${rightX}" y="${s(154)}" fill="#fdf8ea" font-family="${font}" font-size="${s(78)}" font-weight="900" letter-spacing="-${s(3)}">“I WILL</text>
      <text x="${rightX}" y="${s(229)}" fill="#fdf8ea" font-family="${font}" font-size="${s(78)}" font-weight="900" letter-spacing="-${s(3)}">COME TO</text>
      <text x="${rightX}" y="${s(307)}" fill="#e1bd5b" font-family="${font}" font-size="${s(88)}" font-weight="900" letter-spacing="-${s(3)}">YOU!!!”</text>

      <rect x="${rightX}" y="${s(329)}" width="${s(112)}" height="${s(6)}" rx="${s(3)}" fill="#e1bd5b"/>

      <text x="${rightX}" y="${s(378)}" fill="#fdf8ea" font-family="${font}" font-size="${s(30)}" font-weight="900">THE FACEBOOK EXCHANGE</text>
      <text x="${rightX}" y="${s(415)}" fill="#fdf8ea" font-family="${font}" font-size="${s(30)}" font-weight="900">I’M PUTTING ON THE RECORD</text>

      <text x="${rightX}" y="${s(460)}" fill="#cfd9ea" font-family="${font}" font-size="${s(18)}" font-weight="600">A demand for a conviction. An accusation without one.</text>
      <text x="${rightX}" y="${s(485)}" fill="#cfd9ea" font-family="${font}" font-size="${s(18)}" font-weight="600">Then these words, preserved exactly as posted.</text>

      <g font-family="${font}" font-size="${s(12)}" font-weight="900" letter-spacing="${s(0.8)}">
        <rect x="${rightX}" y="${s(514)}" width="${s(179)}" height="${s(31)}" rx="${s(15)}" fill="#ffffff" opacity="0.09"/>
        <text x="${rightX + s(14)}" y="${s(535)}" fill="#fdf8ea">4 ORIGINAL SCREENSHOTS</text>
        <rect x="${rightX + s(190)}" y="${s(514)}" width="${s(166)}" height="${s(31)}" rx="${s(15)}" fill="#ffffff" opacity="0.09"/>
        <text x="${rightX + s(204)}" y="${s(535)}" fill="#fdf8ea">DENIALS INCLUDED</text>
        <rect x="${rightX + s(367)}" y="${s(514)}" width="${s(159)}" height="${s(31)}" rx="${s(15)}" fill="#ffffff" opacity="0.09"/>
        <text x="${rightX + s(381)}" y="${s(535)}" fill="#fdf8ea">NO RETALIATION</text>
      </g>

      <line x1="${rightX}" y1="${s(568)}" x2="${rightX + rightW}" y2="${s(568)}" stroke="#ffffff" stroke-opacity="0.2" stroke-width="${Math.max(1, s(1))}"/>
      <text x="${rightX}" y="${s(596)}" fill="#cfd9ea" font-family="${font}" font-size="${s(14)}" font-weight="800" letter-spacing="${s(0.8)}">RYAN NICHOLS · EAST TEXAS · AUGUST 2026</text>
      <text x="${rightX + rightW}" y="${s(596)}" text-anchor="end" fill="#e1bd5b" font-family="${font}" font-size="${s(14)}" font-weight="900" letter-spacing="${s(0.8)}">REALRYANNICHOLS.COM</text>
    </svg>
  `);

  return sharp(background)
    .composite([{ input: roundedReceipt, left: shotX, top: shotY }])
    .jpeg({ quality: width >= 3000 ? 94 : 92, chromaSubsampling: "4:4:4" })
    .toBuffer();
}
