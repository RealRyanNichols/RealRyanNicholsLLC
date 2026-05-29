"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A dependency-free crop + rotate tool. The user picks a file, pans (drag),
// zooms (slider), and rotates in 90° steps; we render the visible frame to an
// offscreen canvas and hand back a JPEG Blob at the requested output size.
// Used by the post editor for the share/OG card and the feed thumbnail.

export type CropAspect = { label: string; ratio: number; outWidth: number };

const VIEW_W = 320; // on-screen crop frame width in CSS px

export function ImageCropper({
  file,
  aspects,
  onCancel,
  onCropped,
}: {
  file: File;
  aspects: CropAspect[];
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [aspect, setAspect] = useState<CropAspect>(aspects[0]);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // degrees, multiples of 90
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // pan in CSS px
  const [busy, setBusy] = useState(false);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const viewH = Math.round(VIEW_W / aspect.ratio);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => setImg(image);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Reset pan whenever the framing inputs change so the image stays centered.
  useEffect(() => {
    setOffset({ x: 0, y: 0 });
  }, [aspect, rotation]);

  // Dimensions of the source image after rotation (swap on 90/270).
  const swapped = rotation % 180 !== 0;
  const srcW = img ? (swapped ? img.naturalHeight : img.naturalWidth) : 0;
  const srcH = img ? (swapped ? img.naturalWidth : img.naturalHeight) : 0;

  // Base scale = "cover" the frame, then multiply by the zoom slider.
  const baseScale = srcW && srcH ? Math.max(VIEW_W / srcW, viewH / srcH) : 1;
  const scale = baseScale * zoom;

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const apply = useCallback(async () => {
    if (!img) return;
    setBusy(true);
    try {
      const outW = aspect.outWidth;
      const outH = Math.round(outW / aspect.ratio);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unsupported.");
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, outW, outH);

      // Step 1: render the source into an "upright" canvas the size of the
      // rotated image (srcW × srcH) so the rest of the math is rotation-free.
      const upright = document.createElement("canvas");
      upright.width = srcW;
      upright.height = srcH;
      const uctx = upright.getContext("2d");
      if (!uctx) throw new Error("Canvas unsupported.");
      uctx.translate(srcW / 2, srcH / 2);
      uctx.rotate((rotation * Math.PI) / 180);
      uctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      // Step 2: the visible frame, expressed in upright-source pixels. The
      // preview centers the (scaled) upright image in the frame and pans by
      // `offset`, so the frame's top-left in source space is:
      const srcVisibleW = VIEW_W / scale;
      const srcVisibleH = viewH / scale;
      const sx = (srcW - srcVisibleW) / 2 - offset.x / scale;
      const sy = (srcH - srcVisibleH) / 2 - offset.y / scale;

      ctx.drawImage(upright, sx, sy, srcVisibleW, srcVisibleH, 0, 0, outW, outH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9),
      );
      if (!blob) throw new Error("Could not render image.");
      onCropped(blob);
    } finally {
      setBusy(false);
    }
  }, [img, aspect, offset, scale, rotation, srcW, srcH, viewH, onCropped]);

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {aspects.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => setAspect(a)}
            className={[
              "rounded-md px-2.5 py-1 text-xs font-bold border transition",
              a.label === aspect.label
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]",
            ].join(" ")}
          >
            {a.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRotation((r) => (r + 90) % 360)}
          className="rounded-md px-2.5 py-1 text-xs font-bold border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]"
          title="Rotate 90°"
        >
          ⟳ Rotate
        </button>
      </div>

      <div
        className="relative mx-auto overflow-hidden rounded-md bg-black touch-none select-none cursor-move"
        style={{ width: VIEW_W, height: viewH }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img.src}
            alt=""
            draggable={false}
            className="absolute left-1/2 top-1/2 max-w-none origin-center"
            style={{
              width: img.naturalWidth * scale,
              height: img.naturalHeight * scale,
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
            Loading…
          </div>
        )}
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
        Zoom
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1"
        />
      </label>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={!img || busy}
          onClick={apply}
          className="btn-accent rounded-md px-4 py-2 text-sm font-bold disabled:opacity-60"
        >
          {busy ? "Working…" : "Use this crop"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
