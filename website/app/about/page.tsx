import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Ryan Nichols — father, builder, J6 survivor, and the long work of healing in public.",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">About</h1>
      <div className="prose-body mt-6">
        <p>
          I&apos;m Ryan Nichols. United States Marine Corps veteran. Founder of Wholesale
          Universe, Inc. — a multi-million-dollar wholesale/retail company I built from
          scratch. Search and Rescue specialist. Father. J6 survivor.
        </p>
        <p>
          I&apos;ve spent a lot of years on platforms I don&apos;t own — getting boosted,
          getting throttled, getting suspended, getting reinstated, watching the whole
          thing reset every few months.
        </p>
        <p>
          This site is the opposite of that. It&apos;s a domain I own and a feed I write.
          Nobody can pull the rug out from under it. If you&apos;re reading this, it&apos;s because
          I sat down and posted it — not because an algorithm decided to surface it.
        </p>
        <p>
          The voice here is plain. The subject matter is faith, family, building, and the
          long work of healing in public. If that&apos;s what you came for, you&apos;re in the right
          place. If you came looking for a fight, you&apos;ll be bored fast.
        </p>
        <p>
          A few things worth knowing about my story are linked below:
        </p>
        <ul>
          <li>
            <Link href="/jan-6" className="underline">
              My Jan 6 story
            </Link>{" "}
            — what happened, what I learned, where I am now.
          </li>
          <li>
            <Link href="/support" className="underline">
              How to support
            </Link>{" "}
            — if my writing has been useful to you and you want to back the work.
          </li>
          <li>
            <Link href="/community-rules" className="underline">
              Community rules
            </Link>{" "}
            — how comments work here.
          </li>
        </ul>
        <p>Thanks for stopping by my front porch.</p>
      </div>
    </article>
  );
}
