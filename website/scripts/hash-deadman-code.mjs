import crypto from "node:crypto";

const code = process.argv[2];
const salt = process.env.DEADMAN_SECRET_SALT;

if (!salt || !code) {
  console.error(
    "Usage: DEADMAN_SECRET_SALT='long-random-salt' node scripts/hash-deadman-code.mjs 'your private code'",
  );
  process.exit(1);
}

if (code.length < 16) {
  console.error("Use a private code that is at least 16 characters long.");
  process.exit(1);
}

console.log(crypto.createHash("sha256").update(`${salt}:${code}`).digest("hex"));
