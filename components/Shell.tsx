"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import { KINDS, todayStr } from "@/lib/engine";
import { Badge } from "./Badge";
import { MovForm } from "./MovForm";
import { DayDrawer } from "./DayDrawer";
import { Toast } from "./Toast";
import type { Tipo } from "@/lib/types";

const NAV = [
  { href: "/saldos", label: "saldos", icon: <path d="M2.5 3.5h15v13h-15zM2.5 8h15M2.5 12h15M7.5 3.5v13" /> },
  { href: "/totais", label: "totais", icon: <path d="M3 6h6M6 3v6M3 14h6M12 4l5 5M17 4l-5 5M12 13h5M12 16h5" /> },
  { href: "/tags", label: "tags", icon: <path d="M3 5h10l4 5-4 5H3z" /> },
  { href: "/horizonte", label: "horizonte", icon: <path d="M2.5 4h15v12h-15zM2.5 8h15M2.5 12h15" /> },
  { href: "/menu", label: "menu", icon: <path d="M3 5h14M3 10h14M3 15h9" /> },
];

function AddMenu({ onPick }: { onPick: (k: Tipo) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const c = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", c);
    return () => document.removeEventListener("mousedown", c);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="nav" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="currentColor" /><path d="M10 6v8M6 10h8" stroke="var(--bg)" strokeWidth="1.8" /></svg>
        <span>adicionar</span>
      </button>
      {open && (
        <div className="menu addmenu">
          <div className="h">adicionar</div>
          {KINDS.map((k) => (
            <button key={k.k} onClick={() => { setOpen(false); onPick(k.k); }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 700 }}><Badge k={k.k} />{k.nome}</span>
              <small>{k.dica}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Frame({ email, children }: { email: string; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { data, error, reload, movForm, openMovForm } = useStore();
  const [col, setCol] = useState(false);
  return (
    <div className={"app" + (col ? " col" : "")}>
      <nav className="rail">
        <div className="logo">
          <svg width="26" height="22" viewBox="0 0 26 22" aria-hidden><rect x="1" y="12" width="5" height="9" rx="1.5" fill="var(--S)" /><rect x="8" y="7" width="5" height="14" rx="1.5" fill="var(--D)" /><rect x="15" y="3" width="5" height="18" rx="1.5" fill="var(--acc)" /><rect x="22" y="9" width="3" height="12" rx="1.5" fill="var(--E)" /></svg>
          <span>meus saldos</span>
        </div>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={"nav" + (path.startsWith(n.href) ? " on" : "")}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">{n.icon}</svg>
            <span>{n.label}</span>
          </Link>
        ))}
        <div className="sep" />
        <div className="dsk"><AddMenu onPick={(k) => openMovForm({ tipo: k })} /></div>
        <button className="nav dsk" onClick={() => router.push("/saldos#hoje")}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="14" height="13" rx="2" /><path d="M3 8h14M7 2.5v3M13 2.5v3" /></svg>
          <span>ir pra hoje</span>
        </button>
        <div className="sync">{email}</div>
        <form action="/auth/signout" method="post" className="dsk">
          <button className="nav"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 4H4v12h4M12 6l4 4-4 4M16 10H8" /></svg><span>sair</span></button>
        </form>
        <button className="colbtn" onClick={() => setCol((c) => !c)} aria-label="Recolher menu lateral">{col ? "›" : "‹"}</button>
      </nav>
      <main>
        {error ? (
          <div className="wrap"><div className="card"><h3>Não consegui carregar seus dados</h3><p className="hint">{error}</p><button className="btn" onClick={reload}>tentar de novo</button></div></div>
        ) : !data ? (
          <div className="wrap"><div className="empty">carregando…</div></div>
        ) : children}
      </main>
      {movForm && <MovForm key={(movForm.mov?.id ?? "novo") + (movForm.tipo ?? "") + (movForm.data ?? "") + todayStr()} />}
      <DayDrawer />
      <Toast />
      <button className="fab" aria-label="Adicionar movimentação" onClick={() => openMovForm({})}>+</button>
    </div>
  );
}

export function Shell({ email, children }: { email: string; children: ReactNode }) {
  return (
    <StoreProvider>
      <Frame email={email}>{children}</Frame>
    </StoreProvider>
  );
}
