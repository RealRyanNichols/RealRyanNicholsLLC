import Link from "next/link";
import type { CasePerson } from "@/lib/case";
import { getJ6PortraitKind } from "@/lib/j6-portrait";

export function J6ProfileImage({
  person,
  variant = "detail",
}: {
  person: CasePerson;
  variant?: "detail" | "card";
}) {
  const portraitKind = getJ6PortraitKind(person);
  const hasPublishedPortrait = portraitKind !== "placeholder";
  const isEditorialPortrait = portraitKind === "editorial";
  const imageUrl = hasPublishedPortrait
    ? person.photo_url!
    : `/api/j6/profile-image/${person.slug}`;
  const alt =
    person.photo_alt_text ||
    (portraitKind === "cleared"
      ? `${person.name} profile photograph in the January 6 case archive`
      : isEditorialPortrait
        ? `${person.name} source-documented editorial photograph in the January 6 case archive`
        : `Archive identity card for ${person.name}; verified portrait not yet available`);
  const cardBadge =
    portraitKind === "cleared"
      ? "Verified portrait"
      : isEditorialPortrait
        ? "Documented editorial use"
        : "Portrait needed";
  const detailBadge =
    portraitKind === "cleared"
      ? "Verified profile photograph"
      : isEditorialPortrait
        ? "Documented editorial-use image"
        : "Archive card · not a photograph";
  const badgeClass =
    portraitKind === "cleared"
      ? "bg-emerald-800 text-white"
      : isEditorialPortrait
        ? "bg-amber-700 text-white"
        : "bg-[#071123] text-[#e1bd5b]";

  if (variant === "card") {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#071123]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          className={[
            "h-full w-full",
            hasPublishedPortrait
              ? "object-cover object-top"
              : "bg-[#071123] object-contain",
          ].join(" ")}
        />
        <span
          className={[
            "absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider shadow",
            badgeClass,
          ].join(" ")}
        >
          {cardBadge}
        </span>
      </div>
    );
  }

  return (
    <figure className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)]">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          className={[
            "w-full object-cover",
            hasPublishedPortrait
              ? "max-h-[560px] object-top"
              : "max-h-[560px] bg-[#071123] object-contain",
          ].join(" ")}
        />
        <span
          className={[
            "absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow",
            badgeClass,
          ].join(" ")}
        >
          {detailBadge}
        </span>
      </div>
      <figcaption className="flex flex-col gap-2 border-t border-[var(--color-line)] px-4 py-3 text-xs leading-relaxed text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>
          {portraitKind === "cleared"
            ? person.photo_credit || person.photo_source_name || "Verified archive portrait."
            : isEditorialPortrait
              ? `${person.photo_credit || person.photo_source_name || "Source documented."} Published for archive identification and reporting; reuse rights are not represented as cleared.`
              : "A verified, rights-cleared likeness has not been approved for this profile yet."}
        </span>
        {!hasPublishedPortrait ? (
          <Link
            href={`/case/people/${person.slug}/suggest`}
            className="shrink-0 font-black text-[var(--color-accent)] hover:underline"
          >
            Suggest a verified portrait →
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
