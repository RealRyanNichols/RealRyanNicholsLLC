/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type JoinState = "idle" | "submitting" | "ok" | "error";

export function HomeRebrand() {
  const root = useRef<HTMLDivElement>(null);
  const [js, setJs] = useState(false);
  const [menu, setMenu] = useState(false);
  const [email, setEmail] = useState("");
  const [join, setJoin] = useState<JoinState>("idle");
  const [joinMsg, setJoinMsg] = useState("You're in. Welcome to the journey.");

  useEffect(() => {
    setJs(true);
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    el.querySelectorAll(".reveal").forEach((n) => io.observe(n));

    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const node = e.target as HTMLElement;
          const to = Number(node.dataset.count || "0");
          let n = 0;
          const step = Math.max(1, Math.round(to / 40));
          const t = window.setInterval(() => {
            n += step;
            if (n >= to) {
              n = to;
              window.clearInterval(t);
            }
            node.textContent = to >= 100 ? n + "+" : String(n);
          }, 22);
          cio.unobserve(node);
        });
      },
      { threshold: 0.5 },
    );
    el.querySelectorAll<HTMLElement>("[data-count]").forEach((n) => cio.observe(n));

    return () => {
      io.disconnect();
      cio.disconnect();
    };
  }, []);

  async function onJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (join === "submitting") return;
    setJoin("submitting");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) {
        setJoinMsg(data.error || "Something went wrong. Try again.");
        setJoin("error");
        return;
      }
      setJoinMsg(data.message || "You're in. Welcome to the journey.");
      setJoin("ok");
      setEmail("");
    } catch {
      setJoinMsg("Network error. Try again.");
      setJoin("error");
    }
  }

  return (
    <div ref={root} className={`rrnx${js ? " js" : ""}${menu ? " menu-open" : ""}`} id="top">
      <header className="nav">
        <div className="wrap nav-in">
          <a className="brand" href="#top"><span className="mark">RN</span> Ryan Nichols</a>
          <nav className="nav-links">
            <a href="#story" onClick={() => setMenu(false)}>The Story</a>
            <a href="#record" onClick={() => setMenu(false)}>The Record</a>
            <a href="#book" onClick={() => setMenu(false)}>The Book</a>
            <a href="#work" onClick={() => setMenu(false)}>Work With Me</a>
          </nav>
          <div className="nav-cta">
            <a className="btn btn-ghost" href="#work">Work With Me</a>
            <a className="btn btn-gold" href="#join">Join</a>
          </div>
          <button className="hamb" aria-label="Menu" onClick={() => setMenu((m) => !m)}>☰</button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap hero-in">
            <div className="reveal in">
              <span className="flagline">🇺🇸 Marine · Father · East Texan</span>
              <h1>Survived it.<br />Grew through it.<br /><span className="u">Now I build.</span></h1>
              <p className="lead">They tried to bury me. I came back — to build my own platform, tell the truth on my own land, and help good people do the same. This is the whole man, not the headline.</p>
              <div className="cta-row">
                <a className="btn btn-gold" href="#join">Join the journey →</a>
                <a className="btn btn-ghost" href="#story">Watch my story</a>
              </div>
              <div className="microcred">Pardoned &amp; free · Search-and-Rescue veteran · Builder of businesses &amp; AI-powered systems</div>
            </div>
            <div className="portrait reveal in">
              <div className="ph">[ YOUR DIRECT-TO-CAMERA<br />HERO VIDEO / PHOTO HERE ]</div>
              <div className="play" aria-hidden="true"></div>
              <div className="tag">"Here's who I really am — in 90 seconds."</div>
            </div>
          </div>
        </section>

        <section className="wins">
          <div className="wrap wins-in">
            <div className="win reveal"><div className="n" data-count="1">0</div><div className="l">U.S. Marine · <b>Search &amp; Rescue</b></div></div>
            <div className="win reveal"><div className="n" data-count="100">0</div><div className="l">families helped in <b>disasters</b></div></div>
            <div className="win reveal"><div className="n" data-count="5">0</div><div className="l"><b>businesses</b> &amp; platforms built</div></div>
            <div className="win reveal"><div className="n" data-count="1">0</div><div className="l">pardoned · <b>free</b> · still standing</div></div>
          </div>
        </section>

        <section className="band" id="story">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="eyebrow">The story they flattened into one headline</span>
              <h2>I'm more than what they did to me.</h2>
              <p>Marine. Rescuer. Father. Builder. The fight is real — but it's a chapter, not the whole book. Here's the arc, told straight: where I came from, what they did, and what I'm building now.</p>
            </div>
            <div className="arc">
              <div className="arc-card served reveal"><div className="bar"></div><div className="step">01 · Who I was</div><h3>Service &amp; rescue</h3><p>A Marine who ran toward the storm — Search and Rescue, pulling families out of hurricane water. Service was the start, not the story.</p></div>
              <div className="arc-card fall reveal"><div className="bar"></div><div className="step">02 · The fall</div><h3>They came for me</h3><p>Years in federal custody for exercising my right to speak. Heartache, loss, the worst of it. They tried to break me and erase the record.</p></div>
              <div className="arc-card build reveal"><div className="bar"></div><div className="step">03 · The rebuild</div><h3>Now I build</h3><p>Pardoned and free. Faith deeper, family closer, pride set aside. I turned the pain into purpose — and into platforms, systems, and a record they can't bury.</p></div>
            </div>
          </div>
        </section>

        <section className="message">
          <div className="wrap message-in reveal">
            <span className="eyebrow" style={{ color: "var(--gold)" }}>Why I do what I do</span>
            <blockquote>It can happen to anyone. It could happen to you.<br />So you take the pain and you turn it into <em>purpose</em>.</blockquote>
            <p className="creed">You pray when you don't want to pray. You work out when you don't want to. You get up and move when you don't want to move. And when you need to lay there and cry — that's okay. But then you get up, and you <b>continue on.</b></p>
            <a className="btn btn-gold" href="#join">Get the messages that keep me going →</a>
          </div>
        </section>

        <section className="band" id="book">
          <div className="wrap">
            <div className="sec-head reveal"><span className="eyebrow">What I'm building now</span><h2>Two things, done right — not fifty.</h2><p>I cut the clutter. There's the book, and there's building <em>with</em> you. That's it.</p></div>
            <div className="offers">
              <div className="offer-card reveal">
                <div className="offer-cover">FIGHTING<br />SHADOWS</div>
                <div className="offer-body">
                  <span className="eyebrow">The book</span>
                  <h3>Fighting Shadows</h3>
                  <p>A memoir of January 6, political persecution, and fighting back. Real. Raw. Unfiltered — the full story in my own words.</p>
                  <div className="price"><span className="now">$17.76</span> <span className="was">$29.99</span> <span className="off">launch price</span></div>
                  <Link className="btn btn-red" href="/book/preorder">Pre-order the book →</Link>
                </div>
              </div>
              <div className="offer-card reveal" id="work">
                <div className="offer-cover work">⚙️<span>BUILD</span></div>
                <div className="offer-body">
                  <span className="eyebrow">Work with me</span>
                  <h3>I'll build your platform — like I built mine.</h3>
                  <p>Own your voice off rented platforms. Websites, funnels, e-commerce, automation, and AI tools most people don't have — set up to capture, sell, and follow up while you sleep.</p>
                  <div className="chips"><span>Web</span><span>AI tools</span><span>E-commerce</span><span>Automation</span></div>
                  <Link className="btn btn-navy" href="/services">Let's build yours →</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="band record" id="record">
          <div className="wrap record-in reveal">
            <div>
              <span className="eyebrow" style={{ color: "var(--gold)" }}>The receipts are public</span>
              <h2>The record they can't bury.</h2>
              <p>Not gossip. Not drama. The documented J6 evidence nexus, the case archive, the timeline, the officials, the geography — sourced and searchable, for defendants, families, attorneys, and journalists.</p>
              <Link className="btn btn-ghost ghost-dark" href="/case">Explore the record →</Link>
            </div>
            <div className="record-stats">
              <div><b>1,571</b><span>J6 defendants</span></div>
              <div><b>1,044</b><span>documents on file</span></div>
              <div><b>39</b><span>timeline events</span></div>
              <div><b>517</b><span>days since the pardon</span></div>
            </div>
          </div>
        </section>

        <section className="join" id="join">
          <div className="wrap join-in reveal">
            <h2>Get on the list. Own the journey with me.</h2>
            <p>Most of you found me on platforms that can throttle, ban, or erase me overnight. Here, no algorithm decides if you hear from me. Get the fight, the wins, and the messages that keep me going — straight to your inbox.</p>
            <form className="join-form" onSubmit={onJoin}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" aria-label="Email address" />
              <button className="btn btn-gold" type="submit" disabled={join === "submitting"}>{join === "submitting" ? "Joining…" : "Join free →"}</button>
            </form>
            {join === "ok" ? <div className="ok">✓ {joinMsg}</div> : null}
            {join === "error" ? <div className="ok" style={{ color: "var(--red)" }}>{joinMsg}</div> : null}
            <div className="reassure">Free · no spam · leave anytime · I read every reply</div>
            <div className="socials"><a href="https://x.com/realryannichols">𝕏 / Twitter</a><a href="https://facebook.com/realryannichols">Facebook</a><a href="#">YouTube</a></div>
          </div>
        </section>
      </main>

      <nav className="mobile-bar">
        <a href="#join">Join</a>
        <Link href="/book/preorder">Book</Link>
        <a href="#work">Work With Me</a>
      </nav>

      <footer className="footer">
        <div className="wrap">
          <div className="f-creed">"As for you, you meant evil against me, but God meant it for good." — Genesis 50:20</div>
          <div className="f-row"><span>© 2026 Ryan Nichols · Real Ryan Nichols LLC · East Texas</span><span className="f-tag">Survived it. Grew through it. Now I build.</span></div>
        </div>
      </footer>
    </div>
  );
}
