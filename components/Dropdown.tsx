"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Dropdown({ label, items, trigger }: { label: string; trigger?: ReactNode; items: { label: ReactNode; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const c = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", c);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", c); document.removeEventListener("keydown", k); };
  }, [open]);
  return (
    <div className="dd" ref={ref}>
      <button className="ib" aria-label={label} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{trigger ?? "⋮"}</button>
      {open && (
        <div className="menu">
          {items.map((it, i) => (
            <button key={i} style={it.danger ? { color: "var(--S)" } : undefined} onClick={() => { setOpen(false); it.onClick(); }}>{it.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
