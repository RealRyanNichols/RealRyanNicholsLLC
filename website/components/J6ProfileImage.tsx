import Link from "next/link";
import type { CasePerson } from "@/lib/case";
import { isClearedJ6Portrait } from "@/lib/j6-portrait";

export function J6ProfileImage({ person }: { person: CasePerson }) {
  const hasClearedPortrait = isClearedJ6Portrait(person);
  const imageUrl = hasClearedPortrait
    ? person.photo_url!
    : `/api/j6/profile-image/${person.slug}`;
  const alt =
    person.photo_alt_text ||
    (hasClearedPortrait
      ? `${person.name} profile photograph in the January 6 case archive`
      : `Archive identity card for ${person.name}; verified portrait not yet available`);

  return (
    <figure className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)]">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          className={[
            "w-full object-cover",
            hasClearedPortrait
              ? "max-h-[560px] object-top"
              : "max-h-[560px] bg-[#071123] object-contain",
          ].join(" ")}
        />
        <span
          className={[
            "absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow",
            hasClearedPortrait
              ? "bg-emerald-800 text-white"
              : "bg-[#071123] text-[#e1bd5b]",
          ].join(" ")}
        >
          {hasClearedPortrait
            ? "Verified profile photograph"
            : "Archive card · not a photograph"}
        </span>
      </div>
      <figcaption className="flex flex-col gap-2 border-t border-[var(--color-line)] px-4 py-3 text-xs leading-relaxed text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>
          {hasClearedPortrait
            ? person.photo_credit || person.photo_source_name || "Verified archive portrait."
            : "A verified, rights-cleared likeness has not been approved for this profile yet."}
        </span>
        {!hasClearedPortrait ? (
          <Link
            href={`/submit?type=j6&about=${encodeURIComponent(person.name)}`}
            className="shrink-0 font-black text-[var(--color-accent)] hover:underline"
          >
            Submit a verified portrait →
          </Link>
        ) : person.photo_source_url ? (
          <a
            href={person.photo_source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-black text-[var(--color-accent)] hover:underline"
          >
            Image source →
          </a>
        ) : null}
      </figcaption>
    </figure>
  );
}
