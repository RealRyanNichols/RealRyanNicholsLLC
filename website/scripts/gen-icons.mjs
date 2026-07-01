import sharp from "sharp";

// THE FAVICON IS RYAN'S FACE. Permanent decision — his explicit call, twice.
// Every tab/PWA icon is generated from his real profile photo
// (public/avatar.jpg). Do NOT replace this with a monogram, logo, or any
// designed mark. If avatar.jpg changes, re-run this script; that is the
// only sanctioned way these icons change.
const SRC = "public/avatar.jpg";

const jobs = [
  ["public/icons/icon-512.png", 512],
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-180.png", 180],
  ["app/icon.png", 64],
  ["app/apple-icon.png", 180],
];

for (const [out, size] of jobs) {
  await sharp(SRC)
    .resize(size, size, { fit: "cover", position: "attention" })
    .png()
    .toFile(out);
  console.log("wrote", out, size, "from", SRC);
}
