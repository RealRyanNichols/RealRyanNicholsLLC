// Dependency-free confetti burst — brand colors, auto-cleans up. Client only.
export function burstConfetti(opts?: { x?: number; y?: number; count?: number }) {
  if (typeof window === "undefined") return;
  const count = opts?.count ?? 90;
  const ox = opts?.x ?? window.innerWidth / 2;
  const oy = opts?.y ?? window.innerHeight * 0.28;
  const colors = ["#e1bd5b", "#f0d27a", "#7fe3a9", "#7fa9e3", "#fdf8ea"];

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:80;overflow:hidden;";
  document.body.appendChild(container);

  type P = { el: HTMLDivElement; x: number; y: number; vx: number; vy: number; rot: number; vr: number };
  const parts: P[] = [];
  for (let i = 0; i < count; i += 1) {
    const el = document.createElement("div");
    const w = 6 + Math.random() * 6;
    el.style.cssText = `position:absolute;width:${w}px;height:${w * 0.6}px;background:${colors[i % colors.length]};border-radius:1px;will-change:transform,opacity;`;
    container.appendChild(el);
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
    const speed = 6 + Math.random() * 9;
    parts.push({
      el,
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 24,
    });
  }

  const gravity = 0.32;
  const start = performance.now();
  function frame(now: number) {
    const t = now - start;
    for (const p of parts) {
      p.vy += gravity;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.el.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg)`;
      p.el.style.opacity = String(Math.max(0, 1 - t / 1400));
    }
    if (t < 1500) requestAnimationFrame(frame);
    else container.remove();
  }
  requestAnimationFrame(frame);
}
