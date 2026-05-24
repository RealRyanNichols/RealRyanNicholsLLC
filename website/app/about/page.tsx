import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Ryan Nichols",
  description:
    "United States Marine Corps veteran. Search and Rescue specialist. Founder of Wholesale Universe. Father. January 6 defendant pardoned January 20, 2025. Charges dismissed with prejudice.",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
        About · realryannichols.com
      </p>
      <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight font-display leading-[1.05]">
        Ryan Nichols
      </h1>
      <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-soft)] leading-relaxed">
        United States Marine Corps veteran. Search and Rescue specialist.
        Founder of Wholesale Universe. Father. January 6 defendant.{" "}
        <strong>Pardoned by President Trump on January 20, 2025.</strong>{" "}
        Charges <strong>dismissed with prejudice</strong> by U.S. Attorney
        Edward R. Martin Jr. — the case cannot be brought again.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/case"
          className="rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-accent-strong)]"
        >
          The J6 Case →
        </Link>
        <Link
          href="/jan-6"
          className="rounded-full border-2 border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-accent)]"
        >
          My Jan 6 story
        </Link>
        <Link
          href="/support"
          className="rounded-full border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-blue-strong)]"
        >
          Back the work
        </Link>
      </div>

      {/* The biography itself — written by Bonnie Nichols, originally
          entered as Exhibit 288 in the federal case. Posted here in full
          because the man behind the case file deserves to be known for
          what he did BEFORE the government weaponized him. */}
      <section className="mt-12 border-t-2 border-[var(--color-line)] pt-10">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
          The biography · Written by Bonnie Nichols · Filed as
          court exhibit, December 14, 2021
        </p>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight font-display">
          The man behind the case file
        </h2>

        <div className="prose-body mt-6 space-y-5">
          <p>
            Ryan Nichols is from East Texas. Father of two young boys,
            Ryan Jr. and Blake — both attended Longview Christian
            School. Brother, uncle, and son.
          </p>

          <p>
            He graduated with honors from Harleton High School in 2009. A
            dedicated athlete — captain of the baseball team, all-district
            linebacker in football, and a powerlifting medalist in his weight
            division. He attended Howard Payne University and East Texas
            Baptist University as a student athlete and played college
            football for one year.
          </p>

          <h3 className="text-xl font-bold tracking-tight font-display mt-8">
            Marine Corps
          </h3>
          <p>
            He cut his college education short to enlist in the U.S. Marine
            Corps in 2010, to serve his country during a time of two wars.
            He served four years on active duty.
          </p>
          <p>
            Two of those years were at the 9th Communications Battalion in
            Okinawa, Japan. He managed 30+ Marines and millions of dollars in
            communication equipment and was a go-to noncommissioned officer
            within the platoon — leading classes, physical training, and
            being trusted with the work that needed to get done. He served on
            the Auxiliary Security Forces in Okinawa. On the week of the 10th
            anniversary of 9/11, a man threatened to blow up the base. Ryan
            calmed the threat down and held the situation until the head of
            base security arrived.
          </p>
          <p>
            He spent one year at Camp Pendleton with 2nd Battalion, 1st
            Marines. During ITX 2013 — the largest deployment readiness
            training the Marine Corps runs — he stepped outside his MOS to
            set up base communications and ran heavy equipment establishing
            berms and lines of open roads for an entire battalion. He worked
            alongside U.S. forces and partner nations from around the world.
          </p>
          <p>
            He was honorably discharged as a noncommissioned officer in 2014.
            Awards: Good Conduct Medal, 4th award Rifle Expert, Global War on
            Terrorism Medal, National Defense Medal, and Overseas Service
            Ribbon.
          </p>

          <h3 className="text-xl font-bold tracking-tight font-display mt-8">
            Family and faith
          </h3>
          <p>
            Ryan is an active member of Mobberly Baptist Church. In his
            younger years he taught Sunday School for the youth at multiple
            churches alongside his father, Pastor Don Nichols.
          </p>

          <h3 className="text-xl font-bold tracking-tight font-display mt-8">
            Wholesale Universe
          </h3>
          <p>
            Ryan is the founder of Wholesale Universe, a multi-million-dollar
            wholesale and retail business that employs 10–18 people. He
            built it from scratch. Ryan consults and coaches other
            business owners — managing and scaling effectively — and offers
            free online training and local seminars for 2,000–3,000 enrolled
            students learning e-commerce on Amazon, Poshmark, eBay, and other
            platforms.
          </p>
          <p>
            The business houses relief supplies in its warehouse and
            regularly donates to the Highway 80 Rescue Mission, The Women&apos;s
            Shelter, and heavy coats for the homeless in Dallas during
            freezing temperatures. During COVID, Ryan paid his staff to take
            time off so they could participate in rescue relief through
            Rescue the Universe.
          </p>

          <h3 className="text-xl font-bold tracking-tight font-display mt-8">
            Rescue the Universe
          </h3>
          <p>
            Ryan founded Rescue the Universe, a 501(c)(3) non-profit that
            donated to multiple charities. Before its social platform was
            taken down, the Facebook page had over 25,000 followers,
            subscribers, and financial contributors.
          </p>
          <p>
            He has participated in more than two dozen hurricane rescues and
            disaster relief efforts — saving lives, providing relief
            supplies, and showing up where help was needed. His first
            hurricane rescue was at age 13, during Katrina. While serving in
            the Marines in Okinawa, he was on the ground for four typhoons,
            most notably Super Typhoon Jelawat.
          </p>

          <p>
            <strong>Hurricane Harvey (2017)</strong> — his first hurricane as
            a civilian. He and a team raised over $30,000 in supplies — a
            boat, motor, diapers, food, formula, water — for families in
            dire straits.
          </p>
          <p>
            <strong>Hurricane Florence (2018)</strong> — Ryan drove over
            2,000 miles and led water rescues for dozens of women, infants,
            elderly, disabled, and animals — boating them out to safety with
            or without their owners.
          </p>
          <p>
            <strong>Hurricane Michael (2018)</strong> — Ryan worked alongside
            U.S. Coast Guard in Panama City, Florida on Med-Evac helicopter
            rescues, guiding rescue swimmers to the ground via his phone. He
            and his father Don performed a search and rescue for an
            eight-months-pregnant woman whose home had collapsed completely
            on top of her.
          </p>
          <p>
            <strong>Hurricane Barry (2019)</strong> — Rescue the Universe
            teamed with Cajun Navy 2016 in Jeanerette, Louisiana.
          </p>
          <p>
            <strong>Hurricane Dorian (2019)</strong> — Ryan and Alex cleared
            roads for first responders in the Carolinas.
          </p>
          <p>
            <strong>Tropical Storm Imelda (2019)</strong> — high-water horse
            rescue for a Texas State Trooper in Vidor, Texas; led trained
            horses to safety; rescued an elderly bedridden man and his
            disabled family.
          </p>
          <p>
            <strong>Tropical Storm Cristobal (2020)</strong> — Louisiana and
            Biloxi. One of the first teams on scene when a missing husband
            and wife were found floating in Lake Pontchartrain after 24
            hours. Rescued 20–30+ people from flooded roads.
          </p>
          <p>
            <strong>Hurricanes Arthur and Hanna (2020)</strong> — pulled
            people and vehicles from ditches as the eyewall was hitting.
          </p>
          <p>
            <strong>Hurricane Laura (2020)</strong> — welfare checks and
            cleanup. Connected distraught mothers in south Louisiana with
            their stranded children.
          </p>
          <p>
            <strong>Hurricane Sally (2020)</strong> — worked with the City of
            Orange firefighters in Foley, Alabama and rescued 50+ people in
            a single day on video. Many were babies, children, and elderly.
            Removed a near-death man from a collapsed building.
          </p>
          <p>
            Ryan and Alex also storm-chased alongside meteorologist Reed
            Timmer, alerting local radio stations and communities to
            impending disasters, then assisting each community with search,
            rescue, recovery, and supplies — Post, TX (an elderly couple
            rescued from a collapsed roof, funds raised to rebuild their
            home), Panola, TX, Hughes Springs, TX, Oklahoma, Kansas, and
            beyond.
          </p>

          <h3 className="text-xl font-bold tracking-tight font-display mt-8">
            Recognition
          </h3>
          <p>
            Ryan was recognized by Ellen DeGeneres on <em>The Ellen Show</em>{" "}
            for search and rescue during Hurricane Florence. Ellen sponsored
            Rescue the Universe with a donation that funded a new rescue
            boat, and donated $25,000 to the Animal Humane Society in his
            honor. 1 Love 4 Animals flew Ryan to Pennsylvania for a follow-up
            event that raised thousands of dollars for rescued animals.
          </p>
          <p>
            He has also been recognized on A&E, the Weather Channel (for
            tornado and natural disaster search and rescue), ABC News with
            David Muir, Daily Mail, KLTV, RUPTLY USA, The Big Bid Theory, and
            many other news outlets for his volunteer disaster-relief work.
            He worked with The Cajun Navy on multiple hurricane search and
            recovery missions.
          </p>

          <h3 className="text-xl font-bold tracking-tight font-display mt-8">
            The man, off the news
          </h3>
          <p>
            Ryan is a homeowner and a proud veteran honored to have served
            his country during a time of multiple wars. He is also a former
            realtor at Texas Real Estate Executives.
          </p>
          <p>
            Most importantly, Ryan is a loving family man. He
            spends his time fishing, dancing, playing video games, and going
            on adventures with his kids. He strives to be a positive
            influence and role model for his boys — to help them find their
            purpose and passions by showing up to{" "}
            <em>be all you can be</em>. Ryan shares his passion for serving
            with his oldest son Ryan Jr., spreading small acts of kindness
            in the local community.
          </p>
          <p>
            Ryan not only seeks to help others, he seeks to grow himself —
            self-help and coaching in every area of his life: personal,
            spiritual, relationship, physical, financial.
          </p>

          <h3 className="text-xl font-bold tracking-tight font-display mt-8">
            What the arrest did to his family
          </h3>
          <p>
            Since Ryan&apos;s arrest, his sons — Ryan Jr. and Blake — have endured
            a traumatizing experience having their father, their role model,
            their best friend ripped from their lives. They struggled in
            school, struggled to sleep, struggled to express their emotions
            and the pain it caused their little hearts. They began
            counseling. They told the counselor they feared they may never
            see their dad again, and found it hard to talk about because
            they didn&apos;t want to hurt mom.
          </p>
          <p>
            Ryan Jr. expressed anger, fear, and anxiety. His grades dropped
            to the low 70s — from being a straight-A student — and he
            refused to do his work, daydreamed, and cried. He said{" "}
            <em>&quot;because life is too hard&quot;</em> to manage. Blake, age 5,
            said <em>&quot;Mom, am I ever going to see my dad again? I forgot
            what he looks like.&quot;</em>
          </p>
          <p>
            Every night before bedtime they say a prayer, and a 5-year-old
            asks Jesus to help bring his daddy home one day.
          </p>

          <h3 className="text-xl font-bold tracking-tight font-display mt-8">
            Who he is
          </h3>
          <p>
            Ryan is a loving father, son, and friend. He is
            always looking for ways to make an impact — big or small — by
            helping others, even strangers, through tough times. A go-to
            person who can listen, empathize, and look for solutions to any
            problem someone faces. From stopping to help a stranger change a
            tire, to driving thousands of miles across country to save lives.
          </p>
          <p>
            His love for his family and children, and his selflessness to run
            into natural disasters to rescue people and animals, is a true
            testament to his character.
          </p>

          <p className="mt-8 text-sm text-[var(--color-muted)]">
            — Bonnie Nichols, filed as Exhibit 288 in{" "}
            <em>United States v. Nichols</em>, December 14, 2021.
          </p>
        </div>
      </section>

      <section className="mt-12 border-t-2 border-[var(--color-line)] pt-10">
        <h2 className="text-2xl font-bold tracking-tight font-display">
          Where to go from here
        </h2>
        <ul className="mt-4 space-y-2 text-base">
          <li>
            <Link href="/case" className="text-[var(--color-accent)] underline font-bold">
              The J6 Case →
            </Link>{" "}
            — every grievance, every official, every event, every document.
            The record I built.
          </li>
          <li>
            <Link href="/j6" className="text-[var(--color-accent)] underline font-bold">
              J6 Anti-Weaponization Case Builder →
            </Link>{" "}
            — free profiles for every January 6 defendant. Their cases stack
            into this one.
          </li>
          <li>
            <Link href="/jan-6" className="text-[var(--color-accent)] underline font-bold">
              My Jan 6 story →
            </Link>{" "}
            — what happened, what I learned, where I am now.
          </li>
          <li>
            <Link href="/support" className="text-[var(--color-accent)] underline font-bold">
              How to support →
            </Link>{" "}
            — if any of this has been useful and you want to back the work.
          </li>
          <li>
            <Link href="/community-rules" className="text-[var(--color-accent)] underline font-bold">
              Community rules →
            </Link>{" "}
            — how comments work here.
          </li>
        </ul>
        <p className="mt-6 text-sm text-[var(--color-ink-soft)]">
          Thanks for stopping by my front porch.
        </p>
      </section>
    </article>
  );
}
