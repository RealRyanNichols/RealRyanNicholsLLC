import type { Metadata } from "next";
import Link from "next/link";
import { getCaseTotals } from "@/lib/case";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Damages",
  description:
    "Itemized damages claimed in United States v. Nichols — liberty lost, marriage and family destroyed, Wholesale Universe Inc. ended, documented medical injury, lasting mental-health impact. The harm the Anti-Weaponization Fund exists to remedy.",
  openGraph: {
    type: "article",
    title: "Damages — United States v. Nichols",
    description:
      "Itemized damages claimed in United States v. Nichols.",
    url: `${SITE.url}/case/damages`,
  },
  alternates: { canonical: `${SITE.url}/case/damages` },
};

type DamageItem = {
  label: string;
  oneLine: string;
  body: string;
  estimate: string;
  sourceSlug?: string;
};

export default async function DamagesPage() {
  const totals = await getCaseTotals();
  const years = (totals.daysDetained / 365.25).toFixed(1);

  const damages: DamageItem[] = [
    {
      label: "Liberty lost",
      oneLine: `${totals.daysDetained.toLocaleString()} days in federal detention before pardon, then dismissed with prejudice.`,
      body: "From the January 18, 2021 arrest to the January 20, 2025 full presidential pardon, Ryan spent " +
        totals.daysDetained.toLocaleString() + " days — roughly " + years + " years — in federal detention. " +
        "Multiple bond hearings denied. Most of that time in solitary confinement. After the pardon, U.S. Attorney " +
        "Edward R. Martin Jr. moved to dismiss the charges with prejudice — the case cannot be brought again. " +
        "The detention that destroyed his marriage, his business, and his health came before either of those vindications.",
      estimate: years + " years of liberty",
      sourceSlug: "solitary-confinement-conditions",
    },
    {
      label: "Business destroyed — Wholesale Universe, Inc.",
      oneLine: "A multi-million-dollar wholesale/retail company built from the ground up — ended by the prosecution.",
      body: "Before January 6, 2021, Ryan was founder and operator of Wholesale Universe, Inc., a multi-million-dollar wholesale/retail company. The indefinite pretrial detention, the public-record indictment, and the denial of business communications together destroyed the company. Industry standing did not recover during the detention period. Economic damage is direct, quantifiable, and attributable to the prosecution.",
      estimate: "Multi-million-dollar enterprise value",
      sourceSlug: "business-career-destroyed",
    },
    {
      label: "Marriage destroyed",
      oneLine: "The marriage did not survive years of pretrial detention.",
      body: "Years of pretrial detention, denied family visits, intercepted mail, transfers without notice, and the GiveSendGo-tied harassment campaign against the family together ended the marriage. The damage is permanent.",
      estimate: "Marriage ended",
      sourceSlug: "marriage-and-family-destroyed",
    },
    {
      label: "Children's daily presence lost",
      oneLine: "Ryan was taken out of his children's daily lives during the years he was detained.",
      body: "Ryan's children grew up without their father in the home during the most critical years of the family unit. Time that cannot be recovered.",
      estimate: years + " years of fatherhood",
      sourceSlug: "marriage-and-family-destroyed",
    },
    {
      label: "Medical injury — coerced COVID vaccine",
      oneLine: "Judge Hogan conditioned the December 20, 2021 bond hearing on Ryan taking the COVID vaccine over his on-record objection. Ryan complied, was injured, and has had medical problems since.",
      body: "On December 4, 2021, Ryan reluctantly received the first COVID dose — coerced as a precondition to his second bond hearing — and suffered documented medical problems afterward. DC DOC then refused to administer the required second dose until after the window expired (IGP #22112144-412, 12/7/21). Bond was denied at the December 20, 2021 hearing despite Judge Hogan's on-record admission that prolonged solitary confinement had violated Ryan's due process rights. The medical sequelae are ongoing.",
      estimate: "Ongoing medical problems",
      sourceSlug: "coerced-covid-vaccination",
    },
    {
      label: "Mental health — PTSD baseline denied, then deepened",
      oneLine: "Pre-existing PTSD/anxiety diagnoses and Sertraline prescription on record before detention; DC DOC refused to honor them; Ryan was placed on suicide watch.",
      body: "Pre-incarceration medical records (DCOL Family Medical, Dec 2020) document PTSD/anxiety diagnoses and an active Sertraline prescription. DC DOC repeatedly denied mental-health care during detention. Ryan was placed on suicide watch in May 2022. The inmate in the neighboring cell hung himself. Lt. Allen's documented remark: \"I hope you don't die.\" Detainee Divontay Brown attempted suicide by hanging after 22+ months in isolation. The pre-existing condition was deepened by deliberate indifference.",
      estimate: "Long-term mental-health damage",
      sourceSlug: "mental-health-denial",
    },
    {
      label: "Documented physical conditions",
      oneLine: "Untreated ear-infection / hearing-loss confirmed by Howard University Hospital ENT (Dr. Kawas); 23-hour-per-day lockdowns labeled \"MENTAL TORTURE\" in the official IGP record; 1,945 recreation minutes lost in a two-week window.",
      body: "Howard University Hospital ENT Dr. Kawas confirmed scarring and ear-infection damage on outside-medical referral. DC DOC's \"no negligence\" resolution to IGP #20220208-914 contradicted the outside provider's findings. 23-hour-per-day lockdowns were formally entered into the IGP record as \"MENTAL TORTURE\" with 1,945 recreation minutes lost across a 14-day window.",
      estimate: "Cumulative physical and psychological harm",
      sourceSlug: "medical-issues-ear",
    },
    {
      label: "Career trajectory ended",
      oneLine: "Marine Corps veteran, Search and Rescue specialist, business founder — now starting from zero at the back half of his career.",
      body: "Beyond the destroyed business, Ryan's broader career trajectory was ended by the prosecution. Recovery in his industry is not possible during a federal case, and the reputational damage from years of federal news coverage extends beyond formal exoneration.",
      estimate: "Career restart at full disadvantage",
      sourceSlug: "business-career-destroyed",
    },
  ];

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 print:py-0">
      <nav className="text-sm text-[var(--color-muted)] mb-4 print:hidden">
        <Link href="/case" className="hover:underline">
          ← J6 Case
        </Link>
      </nav>
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Damages — United States v. Nichols
      </p>
      <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
        What it cost him.
      </h1>
      <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-soft)] max-w-3xl leading-relaxed">
        Itemized harms inflicted by the federal prosecution and pretrial detention of Ryan Nichols.
        Direct, documented, and measurable — the basis for the Anti-Weaponization Fund compensation
        claim.
      </p>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
        <Stat label="Days detained" value={totals.daysDetained.toLocaleString()} />
        <Stat label="Years of liberty lost" value={String(years)} />
        <Stat label="Facilities cycled" value={String(totals.facilities)} />
        <Stat label="Grievances filed" value={String(totals.grievances)} />
      </div>

      <section className="mt-10 space-y-6">
        {damages.map((d, i) => (
          <article
            key={d.label}
            className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6 print:break-inside-avoid"
          >
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold">
              Harm #{i + 1}
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">{d.label}</h2>
            <p className="mt-2 text-sm sm:text-base font-semibold text-[var(--color-ink)]">
              {d.oneLine}
            </p>
            <p className="mt-3 text-sm text-[var(--color-ink-soft)] leading-relaxed">{d.body}</p>
            <div className="mt-4 flex items-baseline justify-between gap-3 flex-wrap">
              <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
                Estimated harm
              </p>
              <p className="text-sm font-bold text-[var(--color-ink)]">{d.estimate}</p>
            </div>
            {d.sourceSlug ? (
              <div className="mt-3 print:hidden">
                <Link
                  href={`/case/grievances/${d.sourceSlug}`}
                  className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
                >
                  See the evidence →
                </Link>
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <section className="mt-12 rounded-2xl border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-5 sm:p-6 print:break-before-page">
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold">
          Relief Sought
        </p>
        <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">
          What this case is asking for.
        </h2>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-[var(--color-accent)] bg-[var(--color-surface)] p-4 print:border-black">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
              Starting claim
            </p>
            <div className="mt-1 text-3xl sm:text-4xl font-bold leading-none text-[var(--color-accent)]">
              $35,000,000
            </div>
          </div>
          <div className="rounded-xl border border-[var(--color-accent)] bg-[var(--color-surface)] p-4 print:border-black">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
              Supported range
            </p>
            <div className="mt-1 text-3xl sm:text-4xl font-bold leading-none text-[var(--color-accent)]">
              $45–50M
            </div>
          </div>
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 print:border-black">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
              Years of liberty lost
            </p>
            <div className="mt-1 text-3xl sm:text-4xl font-bold leading-none text-[var(--color-ink)]">
              {years}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--color-muted)] leading-relaxed">
          The starting figure represents the documented itemized harms above. The supported
          range reflects the addition of consequential damages: lost lifetime earning capacity,
          long-term medical care for documented sequelae, and the irreversible destruction of
          the family unit and Wholesale Universe, Inc.
        </p>

        <ul className="mt-5 space-y-3 text-sm sm:text-base text-[var(--color-ink-soft)] leading-relaxed">
          <li>
            <span className="font-bold text-[var(--color-ink)]">Compensatory damages</span> for
            wrongful pretrial detention, business destruction, marriage destruction, medical
            injury, and mental-health harm — to be calculated by the panel from the itemized harms
            above.
          </li>
          <li>
            <span className="font-bold text-[var(--color-ink)]">Restitution</span> for the
            quantifiable enterprise value of Wholesale Universe, Inc. lost during detention.
          </li>
          <li>
            <span className="font-bold text-[var(--color-ink)]">Ongoing medical care</span> for the
            documented sequelae of the coerced COVID-19 vaccination and the years of denied
            mental-health treatment.
          </li>
          <li>
            <span className="font-bold text-[var(--color-ink)]">Public accountability</span> for
            the named DC DOC, U.S. Marshals, and federal-court officials whose conduct is in the
            documentary record — including the Brady violation surrounding Marcus DiPaola and
            1% Watchdog.
          </li>
        </ul>
      </section>

      <div className="mt-10 border-t border-[var(--color-line)] pt-6 text-sm text-[var(--color-ink-soft)] print:hidden">
        <Link href="/case/brief" className="text-[var(--color-accent)] underline font-semibold">
          Read the full Compensation Brief →
        </Link>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 print:border-black">
      <div className="text-2xl sm:text-3xl font-bold leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold mt-1.5">
        {label}
      </div>
    </div>
  );
}
