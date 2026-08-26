import crypto from "node:crypto";

const entries = process.argv.slice(2);
if (entries.length === 0 || entries.some((entry) => !entry.includes("="))) {
  console.error(
    "Usage: node scripts/generate-deadman-activators.mjs 'contact-id=Contact Name' ['second-id=Second Name']",
  );
  process.exit(1);
}

const salt = crypto.randomBytes(32).toString("base64url");
const hash = (code) =>
  crypto.createHash("sha256").update(`${salt}:${code}`).digest("hex");
const makeCode = () => crypto.randomBytes(24).toString("base64url");

const plaintext = [];
const activators = entries.map((entry) => {
  const separator = entry.indexOf("=");
  const id = entry.slice(0, separator).trim();
  const label = entry.slice(separator + 1).trim();
  if (!/^[a-z0-9][a-z0-9_-]{1,39}$/i.test(id) || label.length < 2) {
    console.error(`Invalid contact entry: ${entry}`);
    process.exit(1);
  }
  const code = makeCode();
  plaintext.push({ id, label, code });
  return { id, label, hash: hash(code), active: true };
});

const reversalCode = makeCode();

console.log("\nVERCEL ENVIRONMENT VALUES\n");
console.log(`DEADMAN_SECRET_SALT=${salt}`);
console.log(`DEADMAN_ACTIVATORS_JSON=${JSON.stringify(activators)}`);
console.log(`DEADMAN_REVERSAL_HASH=${hash(reversalCode)}`);
console.log("\nPRIVATE CONTACT HANDOFFS — SEND ONCE; DO NOT STORE IN GIT\n");
for (const item of plaintext) {
  console.log(`${item.label}\nContact ID: ${item.id}\nActivation code: ${item.code}\nURL: https://realryannichols.com/deadman?contact=${encodeURIComponent(item.id)}\n`);
}
console.log(`OWNER REVERSAL CODE\n${reversalCode}\n`);
