import { existsSync } from "node:fs";
import path from "node:path";

/**
 * The digital reader edition that ships inside the deployment bundle.
 *
 * Shipping a revision: drop the new PDF in website/private/book, bump
 * EDITION_FILE, redeploy. Every buyer download token keeps working and starts
 * serving the new file, which is what buyers were promised.
 *
 * The file deliberately lives outside /public. The only path to it is a valid
 * order token.
 */
export const EDITION_FILE = "fighting-shadows-2026-09-13.pdf";
export const EDITION_DOWNLOAD_NAME = "Fighting Shadows - Ryan Nichols.pdf";

export function bundledEditionPath(): string {
  return path.join(process.cwd(), "private", "book", EDITION_FILE);
}

/** True once a buyer can actually download something right now. */
export function isBookEditionReady(): boolean {
  if (process.env.BOOK_DOWNLOAD_URL) return true;
  try {
    return existsSync(bundledEditionPath());
  } catch {
    return false;
  }
}
