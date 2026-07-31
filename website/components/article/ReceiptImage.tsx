"use client";

import { useState } from "react";

// The exhibit image inside a {{receipt}}. Click to open full size in a
// lightbox; Escape or click anywhere closes. No external deps.
export function ReceiptImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 block w-full cursor-zoom-in overflow-hidden rounded-md border border-[#e1bd5b]/30 bg-black"
        aria-label="Open exhibit image full size"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="max-h-[420px] w-full object-contain" />
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Exhibit image, full size"
          className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-[#061020]/95 p-4"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          tabIndex={-1}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-[#0b1b34] text-xl font-bold text-[#f4efe4]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      ) : null}
    </>
  );
}
