"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./InteractiveArticle.module.css";

// Attention-first article renderer: reading-progress bar, bold/large paragraph
// openings + per-section drop caps (via the CSS module), animated pull-quotes,
// and scroll-reveal on every block. Renders the post's markdown body.
export function InteractiveArticle({ body }: { body: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [animate, setAnimate] = useState(false);

  // Reading-progress bar tied to how far through the article you've scrolled.
  useEffect(() => {
    function onScroll() {
      const el = ref.current;
      if (!el) return;
      const total = el.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY - el.offsetTop;
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Reveal blocks as they enter the viewport — a pure progressive enhancement.
  // Content is visible by default (see CSS); we only turn on the hide-then-
  // animate behavior once JS + IntersectionObserver are confirmed available,
  // and we pre-reveal anything already on screen so nothing blinks out. If any
  // of this can't run (e.g. an in-app browser), the article just stays visible.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const blocks = Array.from(
      el.querySelectorAll<HTMLElement>(`.${styles.reveal}`),
    );
    if (blocks.length === 0) return;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // Pre-reveal blocks already in (or near) view so they don't flash out.
    for (const b of blocks) {
      if (b.getBoundingClientRect().top < vh * 0.95) {
        b.classList.add(styles.revealed);
      }
    }
    setAnimate(true);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    for (const b of blocks) {
      if (!b.classList.contains(styles.revealed)) io.observe(b);
    }
    // Safety net: never leave anything hidden — reveal everything after 2.5s.
    const t = window.setTimeout(() => {
      for (const b of blocks) b.classList.add(styles.revealed);
    }, 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, [body]);

  return (
    <>
      <div
        className={styles.progress}
        style={{ width: `${progress}%` }}
        aria-hidden
      />
      <div
        ref={ref}
        className={`${styles.article}${animate ? ` ${styles.animate}` : ""}`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2({ children }) {
              return (
                <h2 className={`${styles.h2} ${styles.reveal}`}>
                  <span className={styles.kicker} aria-hidden />
                  {children}
                </h2>
              );
            },
            h3({ children }) {
              return <h3 className={`${styles.h3} ${styles.reveal}`}>{children}</h3>;
            },
            p({ children }) {
              return <p className={styles.reveal}>{children}</p>;
            },
            blockquote({ children }) {
              return (
                <blockquote className={`${styles.quote} ${styles.reveal}`}>
                  {children}
                </blockquote>
              );
            },
            ul({ children }) {
              return <ul className={`${styles.list} ${styles.reveal}`}>{children}</ul>;
            },
            ol({ children }) {
              return <ol className={`${styles.list} ${styles.reveal}`}>{children}</ol>;
            },
            hr() {
              return <hr className={styles.hr} />;
            },
            img({ src, alt }) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={typeof src === "string" ? src : ""}
                  alt={alt ?? ""}
                  className={`${styles.img} ${styles.reveal}`}
                />
              );
            },
            a({ href, children }) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              );
            },
          }}
        >
          {body}
        </ReactMarkdown>
      </div>
    </>
  );
}
