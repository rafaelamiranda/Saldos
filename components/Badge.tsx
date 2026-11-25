import type { Tipo } from "@/lib/types";

const ICON: Record<Tipo, React.ReactNode> = {
  E: (<svg viewBox="0 0 12 12" aria-hidden><path d="M9.5 2.5 3 9M3 4.5V9h4.5" stroke="#fff" strokeWidth="1.8" fill="none" /></svg>),
  S: (<svg viewBox="0 0 12 12" aria-hidden><path d="M2.5 9.5 9 3M4.5 3H9v4.5" stroke="#fff" strokeWidth="1.8" fill="none" /></svg>),
  D: "D",
  Eco: "E",
  C: "C",
};

export function Badge({ k, off, size }: { k: Tipo; off?: boolean; size?: number }) {
  return (
    <span className={"bd" + (off ? " off" : "")} style={{ background: `var(--${k})`, ...(size ? { width: size, height: size, fontSize: size * 0.55 } : {}) }}>
      {ICON[k]}
    </span>
  );
}

export function ForecastBadge() {
  return <span className="bd fc">D</span>;
}
