import { jsonString } from "@/lib/shortcodes";
import { ReceiptImage } from "./ReceiptImage";

// {{receipt: {...}}} — the proof block. The component that makes an article
// a record instead of an opinion. Navy card, gold left rule, cream body.
// Restricted labels (PRIVATE / NOT PUBLIC, SEALED) fail closed: the claim
// renders, the image and URL never do, even if present in the payload.

const LABELS = [
  "FACT",
  "RYAN STATEMENT",
  "DOCUMENTED INFERENCE",
  "NEEDS AUTHENTICATION",
  "PRIVATE / NOT PUBLIC",
  "SEALED",
] as const;
type ReceiptLabel = (typeof LABELS)[number];

const RESTRICTED: ReceiptLabel[] = ["PRIVATE / NOT PUBLIC", "SEALED"];

function chipClass(label: ReceiptLabel): string {
  switch (label) {
    case "FACT":
      return "bg-[#e1bd5b] text-[#061020]";
    case "NEEDS AUTHENTICATION":
      return "bg-[#8a6d1f]/60 text-[#f4efe4]";
    case "PRIVATE / NOT PUBLIC":
    case "SEALED":
      return "bg-[#3a4358] text-[#cfd9ea]";
    default: // RYAN STATEMENT, DOCUMENTED INFERENCE
      return "border border-[#f4efe4]/50 text-[#f4efe4]";
  }
}

export function Receipt({ value }: { value: Record<string, unknown> }) {
  const rawLabel = jsonString(value, "label")?.toUpperCase();
  const label = LABELS.find((l) => l === rawLabel);
  const claim = jsonString(value, "claim");
  if (!label || !claim) return null; // no label, no claim, no receipt

  const restricted = RESTRICTED.includes(label);
  const source = jsonString(value, "source");
  const url = restricted ? undefined : jsonString(value, "url");
  const image = restricted ? undefined : jsonString(value, "image");
  const exhibitId = jsonString(value, "exhibit_id");
  const note = jsonString(value, "note");

  return (
    <aside
      id={exhibitId || undefined}
      className="not-prose my-7 overflow-hidden rounded-lg border-l-4 border-[#e1bd5b] bg-[#0b1b34] text-[#f4efe4]"
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-block rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${chipClass(label)}`}
          >
            {label}
          </span>
          {exhibitId ? (
            <a
              href={`#${exhibitId}`}
              className="rounded border border-[#e1bd5b]/40 px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#e1bd5b] no-underline"
            >
              {exhibitId}
            </a>
          ) : null}
        </div>

        <p className="mt-3 text-base font-bold leading-snug text-[#f4efe4] sm:text-lg">
          {claim}
        </p>

        {image ? <ReceiptImage src={image} alt={claim} /> : null}

        {source ? (
          <p className="mt-3 text-sm text-[#a9b7d0]">
            <span className="font-bold uppercase tracking-wider text-[11px] text-[#e1bd5b]">
              Source:
            </span>{" "}
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#cfd9ea] underline decoration-[#e1bd5b] underline-offset-2"
              >
                {source} <span aria-hidden>↗</span>
              </a>
            ) : (
              source
            )}
          </p>
        ) : null}

        {restricted ? (
          <p className="mt-3 text-xs font-semibold text-[#a9b7d0]">
            The underlying record is not public. The claim stands on the label
            above; the paper stays where the law puts it.
          </p>
        ) : null}

        {note ? <p className="mt-2 text-xs italic text-[#a9b7d0]">{note}</p> : null}
      </div>
    </aside>
  );
}
