"use client";
import { useEffect, useMemo } from "react";
import { Badge } from "./Badge";
import { ItemActions, TagChips } from "./ItemRow";
import { KINDS, KN, MS, REPS, addD, brl, occ } from "@/lib/engine";
import { useStore } from "@/lib/store";
import type { Occ, Tipo } from "@/lib/types";

export function DayDrawer() {
  const { drawer, setDrawer, data, openMovForm } = useStore();
  useEffect(() => {
    if (!drawer) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(null);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [drawer, setDrawer]);
  const items = useMemo<Occ[]>(() => {
    if (!drawer || !data) return [];
    return data.movs.flatMap((m) => occ(m, drawer.date)).filter((o) => o.d === drawer.date && (!drawer.kind || o.m.tipo === drawer.kind));
  }, [drawer, data]);
  if (!drawer || !data) return null;
  const { date, kind } = drawer;
  return (
    <>
      <div className="ov show" onClick={() => setDrawer(null)} />
      <aside className="drawer show" aria-label="Movimentações do dia">
        <div className="dh">
          <button className="ib" onClick={() => setDrawer(null)} aria-label="Fechar">×</button>
          <span style={{ flex: 1 }} />
          <button className="ib" aria-label="Dia anterior" onClick={() => setDrawer({ date: addD(date, -1), kind })}>‹</button>
          <b>{date.slice(8)}/{MS[+date.slice(5, 7) - 1]}</b>
          <button className="ib" aria-label="Próximo dia" onClick={() => setDrawer({ date: addD(date, 1), kind })}>›</button>
          <span style={{ flex: 1 }} />
          <button className="ib" aria-label="Adicionar" onClick={() => openMovForm({ tipo: (kind || "E") as Tipo, data: date })}>+</button>
        </div>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
          <select className="inp" aria-label="Filtrar por tipo" value={kind} onChange={(e) => setDrawer({ date, kind: e.target.value as Tipo | "" })}>
            <option value="">todas</option>
            {KINDS.map((k) => <option key={k.k} value={k.k}>{k.plural}</option>)}
          </select>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {items.length ? items.map((o) => (
            <div className="it" key={o.m.id + o.d}>
              <div className="l1"><Badge k={o.m.tipo} /><span style={{ flex: 1 }}>{o.m.descricao || KN[o.m.tipo].nome}</span><span>{brl(o.v)}</span><ItemActions o={o} /></div>
              <div className="l2">
                <span>{o.d.slice(8)}/{o.d.slice(5, 7)}{o.m.cartao_id ? " · " + (data.cartoes.find((c) => c.id === o.m.cartao_id)?.nome ?? "") : ""}</span>
                <span>{o.m.repeticao !== "none" ? "↻ " + REPS.find((r) => r.r === o.m.repeticao)?.nome + (o.t ? ` ${o.i}/${o.t}` : "") : ""}</span>
              </div>
              <div><TagChips m={o.m} /></div>
            </div>
          )) : <div className="empty">nada lançado neste dia</div>}
        </div>
      </aside>
    </>
  );
}
