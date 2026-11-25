"use client";
import { MS, addM, ym } from "@/lib/engine";

export function MonthNav({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [y, m] = value.split("-").map(Number);
  return (
    <>
      <button className="ib" aria-label="Mês anterior" onClick={() => onChange(ym(addM(value + "-01", -1)))}>‹</button>
      <span className="pill">{MS[m - 1]}/{y}</span>
      <button className="ib" aria-label="Próximo mês" onClick={() => onChange(ym(addM(value + "-01", 1)))}>›</button>
    </>
  );
}

export function TopBar({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="top">
      <h1>{title}</h1>
      {children}
    </div>
  );
}
