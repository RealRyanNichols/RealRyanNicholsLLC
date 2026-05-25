"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  slug: string;
  name: string;
  type: string;
  price_cents: number;
  active: boolean;
  stripe_price_id: string | null;
};

export function StoreAdmin({ products }: { products: Product[] }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  return (
    <div className="space-y-8">
      <NewProduct onDone={refresh} />
      <div>
        <h2 className="text-lg font-bold tracking-tight mb-3">
          Products ({products.length})
        </h2>
        <div className="space-y-2">
          {products.map((p) => (
            <ProductRow key={p.id} product={p} onDone={refresh} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NewProduct({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("service");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function create() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          name: name.trim(),
          price_cents: Math.round(Number(price) * 100),
          type,
          description: description.trim() || undefined,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(j.error ?? "Could not create.");
        setBusy(false);
        return;
      }
      setMsg("Created (as a draft — publish it below).");
      setSlug("");
      setName("");
      setPrice("");
      setDescription("");
      onDone();
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-accent rounded-lg px-4 py-2 text-sm font-bold"
      >
        + New product
      </button>
    );
  }

  const input =
    "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]";
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input className={input} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={input} placeholder="slug-like-this" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={input} placeholder="Price (USD, e.g. 97)" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        <select className={input} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="service">service</option>
          <option value="physical">physical</option>
          <option value="digital">digital</option>
        </select>
      </div>
      <textarea className={input} rows={2} placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      {msg ? <p className="text-xs text-[var(--color-accent)]">{msg}</p> : null}
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={create} className="btn-accent rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-60">
          {busy ? "Creating…" : "Create draft"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold">
          Cancel
        </button>
      </div>
    </div>
  );
}

function ProductRow({ product, onDone }: { product: Product; onDone: () => void }) {
  const [price, setPrice] = useState(String(product.price_cents / 100));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/products/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, ...body }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(j.error ?? "Failed.");
        setBusy(false);
        return;
      }
      onDone();
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[12rem]">
        <p className="font-bold text-sm">{product.name}</p>
        <p className="text-[11px] text-[var(--color-muted)] font-mono">
          {product.slug} · {product.type}
          {product.stripe_price_id ? " · stripe ✓" : " · no stripe price"}
        </p>
      </div>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-paper)]"
        style={{
          background: product.active
            ? "var(--color-success)"
            : "var(--color-muted)",
        }}
      >
        {product.active ? "Live" : "Draft"}
      </span>
      <div className="flex items-center gap-1">
        <span className="text-sm text-[var(--color-muted)]">$</span>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          className="w-20 rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1 text-sm"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => patch({ price_cents: Math.round(Number(price) * 100) })}
          className="text-xs font-bold text-[var(--color-accent)] disabled:opacity-60"
        >
          Save
        </button>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => patch({ active: !product.active })}
        className="rounded-lg border-2 border-[var(--color-accent)] px-3 py-1 text-xs font-bold text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)] transition disabled:opacity-60"
      >
        {product.active ? "Unpublish" : "Publish"}
      </button>
      {msg ? <span className="w-full text-xs text-red-700">{msg}</span> : null}
    </div>
  );
}
