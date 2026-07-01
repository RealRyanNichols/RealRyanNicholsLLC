import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { ShareRail } from "@/components/ShareRail";
import { ReactionBar } from "@/components/ReactionBar";
import { SITE } from "@/lib/site";

export const revalidate = 300;

const TITLE =
  "The Accountability Index — everyone named in the record of United States v. Nichols";
const DESCRIPTION =
  "Every official, attorney, witness, and decision-maker named in the documented January 6 case of Ryan Nichols — the detention chain, the prosecutors, the judges, the informants — organized by where they sat. Sourced. Public. Read the record and judge for yourself.";

export const metadata: Metadata = {
  title: "The Accountability Index",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/case/officials` },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE.url}/case/officials`,
    images: [`${SITE.url}/og/site`],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [`${SITE.url}/og/site`] },
};

type Official = {
  name: string;
  slug: string;
  role: string | null;
  agency: string | null;
};

// Ordered super-groups. The accountability core (detention, prosecution,
// courts) leads; counsel, allies, and witnesses follow as context. Every
// person is placed by their documented role/agency — the page indexes the
// record, it does not assign blame; each profile carries the sourced detail.
const SUPERGROUPS: {
  key: string;
  title: string;
  blurb: string;
}[] = [
  {
    key: "detention",
    title: "The detention chain",
    blurb:
      "The officials who ran the facilities and the conditions — DC DOC, its medical unit, the regional jails, the Bureau of Prisons, and the U.S. Marshals.",
  },
  {
    key: "prosecution",
    title: "The prosecution & the courts",
    blurb:
      "The U.S. Attorney's Office that charged the case and the judges who ruled on it.",
  },
  {
    key: "informant",
    title: "Informants & provocateur questions",
    blurb:
      "People tied to federal-informant claims and open questions about who steered events.",
  },
  {
    key: "counsel",
    title: "Defense counsel",
    blurb: "The lawyers and public defenders on the defense side of the record.",
  },
  {
    key: "allies",
    title: "In Congress & the executive",
    blurb:
      "Elected officials named in the record — including those who acted in Ryan's favor.",
  },
  {
    key: "witness",
    title: "Fellow detainees & witnesses",
    blurb: "Co-detainees, family, and others who witnessed or corroborate the record.",
  },
  { key: "other", title: "Also named in the record", blurb: "" },
];

function groupFor(o: Official): string {
  const role = (o.role ?? "").toLowerCase();
  const agency = (o.agency ?? "").toLowerCase();
  if (/detainee|victim|co-?detainee/.test(role)) return "witness";
  if (agency === "family") return "witness";
  if (/informant|federal-tied|capitol crowd|watchdog/.test(agency) || /informant|provocateur/.test(role))
    return "informant";
  if (/defender|counsel|defense/.test(agency) || /defense attorney|defender/.test(role))
    return "counsel";
  if (/doc|jail|bureau of prisons|marshal/.test(agency)) return "detention";
  if (/attorney|district court|magistrate/.test(agency) || /judge|attorney|prosecutor/.test(role))
    return "prosecution";
  if (/legislative|executive/.test(agency)) return "allies";
  return "other";
}

export default async function AccountabilityIndexPage() {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_people")
    .select("name, slug, role, agency")
    .eq("is_j6_defendant", false)
    .eq("visibility", "public")
    .order("agency", { ascending: true })
    .order("name", { ascending: true });
  const officials = (data ?? []) as Official[];

  const byGroup = new Map<string, Official[]>();
  for (const o of officials) {
    const g = groupFor(o);
    const list = byGroup.get(g) ?? [];
    list.push(o);
    byGroup.set(g, list);
  }

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
        The case · accountability
      </p>
      <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05] font-display">
        The Accountability Index
      </h1>
      <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-soft)] max-w-3xl leading-relaxed">
        Every person named in the documented record of{" "}
        <em>United States v. Nichols</em> — organized by where they sat. The
        officials who ran the detention. The prosecutors who charged it. The
        judges who ruled. The informant questions. And the counsel, allies,
        and witnesses on the other side of the ledger. This page is the
        index; <strong>each name links to exactly what the record says</strong>{" "}
        about them. Some are accused of specific conduct, some acted in Ryan&apos;s
        favor — read it and judge for yourself.
      </p>
      <p className="mt-3 text-sm text-[var(--color-muted)]">
        {officials.length} people of record. Sourced from grievances, court
        filings, and Ryan&apos;s first-person account.
      </p>

      <div className="mt-6">
        <ShareRail
          url={`${SITE.url}/case/officials`}
          title="The Accountability Index — everyone named in the record of United States v. Nichols, by agency: realryannichols.com/case/officials"
        />
      </div>
      <div className="mt-3">
        <ReactionBar targetType="page" targetId="case-officials" />
      </div>

      <div className="mt-10 space-y-10">
        {SUPERGROUPS.map((sg) => {
          const people = byGroup.get(sg.key) ?? [];
          if (people.length === 0) return null;
          return (
            <section key={sg.key}>
              <div className="border-l-4 border-[var(--color-accent)] pl-4">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-display">
                  {sg.title}
                  <span className="ml-2 text-sm font-mono text-[var(--color-muted)]">
                    {people.length}
                  </span>
                </h2>
                {sg.blurb ? (
                  <p className="mt-1 text-sm text-[var(--color-ink-soft)] max-w-2xl">
                    {sg.blurb}
                  </p>
                ) : null}
              </div>
              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {people.map((o) => (
                  <li key={o.slug}>
                    <Link
                      href={`/case/people/${o.slug}`}
                      className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5 hover:border-[var(--color-accent)] transition group"
                    >
                      <p className="font-bold tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
                        {o.name}
                      </p>
                      {o.role ? (
                        <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
                          {o.role}
                        </p>
                      ) : null}
                      {o.agency ? (
                        <p className="mt-0.5 text-[11px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
                          {o.agency}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CrossLink href="/case/nexus" title="The Case Nexus" sub="Walk the network as a graph." />
        <CrossLink href="/evidence-the-doj-tried-to-erase" title="Evidence the DOJ tried to erase" sub="The preserved record." />
        <CrossLink href="/case" title="The full case file" sub="Grievances, events, documents." />
      </section>
    </article>
  );
}

function CrossLink({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)] transition group"
    >
      <p className="text-sm font-bold tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
        {title}
      </p>
      <p className="mt-1 text-xs leading-snug text-[var(--color-ink-soft)]">{sub}</p>
    </Link>
  );
}
