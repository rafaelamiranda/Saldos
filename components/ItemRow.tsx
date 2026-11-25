"use client";
import { Badge } from "./Badge";
import { Dropdown } from "./Dropdown";
import { KN, REPS, brl } from "@/lib/engine";
import { useStore } from "@/lib/store";
import type { Mov, Occ } from "@/lib/types";

export function TagChips({ m }: { m: Mov }) {
  const { data } = useStore();
  return (
    <>
      {m.tag_ids.map((id) => {
        const t = data?.tags.find((x) => x.id === id);
        return t ? <span key={id} className="chip" style={{ background: t.cor }}>{t.nome}</span> : null;
      })}
    </>
  );
}

export function ItemActions({ o }: { o: Occ }) {
  const { openMovForm, duplicateMov, excludeOccurrence, deleteMov } = useStore();
  const rec = o.m.repeticao !== "none";
  const dd = `${o.d.slice(8)}/${o.d.slice(5, 7)}`;
  return (
    <Dropdown
      label="Opções da movimentação"
      items={[
        { label: "editar", onClick: () => openMovForm({ mov: o.m }) },
        { label: "duplicar neste dia", onClick: () => duplicateMov(o.m, o.d) },
        ...(rec ? [{ label: `excluir só ${dd}`, onClick: () => excludeOccurrence(o.m, o.d) }] : []),
        { label: rec ? "excluir a série inteira" : "excluir", danger: true, onClick: () => deleteMov(o.m.id) },
      ]}
    />
  );
}

export function ItemRow({ o }: { o: Occ }) {
  return (
    <div className="row">
      <Badge k={o.m.tipo} />
      <div className="grow">
        <div>
          <b>{o.m.descricao || KN[o.m.tipo].nome}</b>
          {o.t ? <span className="hint"> {o.i}/{o.t}</span> : null}
        </div>
        <div className="hint" style={{ margin: 0 }}>
          {o.d.slice(8)}/{o.d.slice(5, 7)}
          {o.m.repeticao !== "none" ? " · ↻ " + REPS.find((r) => r.r === o.m.repeticao)?.nome : ""} <TagChips m={o.m} />
        </div>
      </div>
      <span className="r">{brl(o.v)}</span>
      <ItemActions o={o} />
    </div>
  );
}
