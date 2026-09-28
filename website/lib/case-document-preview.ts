type DocumentSource = {
  file_url: string | null;
  external_url: string | null;
  file_mime?: string | null;
};

export type DocumentPreview = {
  kind: "pdf" | "image" | "external" | "unavailable";
  url: string | null;
};

// A remote source may be a news page or interview, not a court filing.
// Prefer recorded MIME data; use the URL path only for older untyped records.
export function getDocumentPreview(source: DocumentSource): DocumentPreview {
  const url = source.file_url || source.external_url;
  if (!url) return { kind: "unavailable", url: null };

  const mime = source.file_mime?.split(";")[0].trim().toLowerCase();
  if (mime === "application/pdf") return { kind: "pdf", url };
  if (mime?.startsWith("image/")) return { kind: "image", url };
  if (mime) return { kind: "external", url };

  let path: string;
  try {
    path = new URL(url, "https://realryannichols.com").pathname.toLowerCase();
  } catch {
    return { kind: "external", url };
  }
  if (path.endsWith(".pdf")) return { kind: "pdf", url };
  if (/\.(jpe?g|png|webp|gif|avif)$/.test(path)) return { kind: "image", url };

  // Legacy uploaded scans have no MIME metadata but use the image proxy.
  return { kind: source.file_url ? "image" : "external", url };
}
