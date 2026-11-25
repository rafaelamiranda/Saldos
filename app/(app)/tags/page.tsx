"use client";
import { useMemo, useState } from "react";
import { Dropdown } from "@/components/Dropdown";
import { ItemRow } from "@/components/ItemRow";
import { Confirm, Modal } from "@/components/Modal";
import { MonthNav, TopBar } from "@/components/MonthNav";
import { TAGCOLORS, brl, compute, endOf, todayStr, ym } from "@/lib/engine";
import { useStore } from "@/lib/store";
import type { Tag } from "@/lib/types";

function TagForm({ tag, onClose }: { tag: Tag | null; onClose: () => void }) {
  const { saveTag, data } = useStore();
  const [nome, setNome] = useState(tag?.nome ?? "");
  const [cor, setCor] = useState(tag?.cor ?? TAGCOLORS[(data?.tags.length ?? 0) % TAGCOLORS.length]);
  return (
    <Modal title={tag ? "editar tag" : "nova tag"} onClose={onClose}>
      <form onSubmit={async (e) => { e.preventDefault(); if (!nome.trim()) return; await saveTag({ id: tag?.id, nome: nome.trim(), cor }); onClose(); }}>
        <div className="fld"><label htmlFor="tN">nome</label><input id="tN" maxLength={60} value={nome} onChange={(e) => setNome(e.target.value)} /></div>
        <div className="tagpick">
          {TAGCOLORS.map((c) => <button type="button" key={c} aria-label={"Cor " + c} onClick={() => setCor(c)} style={{ background: c, width: 34, height: 34, outline: c === cor ? "3px solid var(--ink)" : undefined }} />)}
        </div>
        <button className="btn">salvar</button>
      </form>
    </Modal>
  );
}

export default function TagsPage() {
  const { data, deleteTag } = useStore();
  const today = todayStr();
  const [mon, setMon] = useState(ym(today));
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Tag | null | undefined>(undefined);
  const [view, setView] = useState<Tag | null>(null);
  const [del, setDel] = useState<Tag | null>(null);
  const c = useMemo(() => (data ? compute(data, endOf(mon), today) : null), [data, mon, today]);
  if (!data || !c) return null;
  const month = c.list.filter((o) => ym(o.d) === mon);
  const sum: Record<string, number> = {};
  for (const o of month) for (const id of o.m.tag_ids) sum[id] = (sum[id] ?? 0) + o.v;
  const tags = data.tags.filter((t) => t.nome.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <TopBar title="tags"><MonthNav value={mon} onChange={setMon} /></TopBar>
      <div className="wrap narrow">
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="inp" placeholder="filtrar tags" aria-label="Filtrar tags" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn" style={{ width: "auto", margin: 0, padding: "0 18px" }} onClick={() => setEdit(null)}>nova tag</button>
        </div>
        <div className="list">
          {tags.length ? tags.map((t) => (
            <div className="row" key={t.id}>
              <span className="dot" style={{ background: t.cor }} />
              <button className="grow" style={{ textAlign: "left", fontWeight: 700, minHeight: 44 }} onClick={() => setView(t)}>{t.nome}</button>
              <span className="r">{brl(sum[t.id] ?? 0)}</span>
              <Dropdown label="Opções da tag" items={[{ label: "editar", onClick: () => setEdit(t) }, { label: "excluir", danger: true, onClick: () => setDel(t) }]} />
            </div>
          )) : <div className="empty">nenhuma tag{q ? " com esse nome" : ""}</div>}
        </div>
      </div>
      {edit !== undefined && <TagForm tag={edit} onClose={() => setEdit(undefined)} />}
      {view && (
        <Modal title={view.nome} onClose={() => setView(null)}>
          <div className="list">
            {month.filter((o) => o.m.tag_ids.includes(view.id)).map((o) => <ItemRow key={o.m.id + o.d} o={o} />)}
            {!month.some((o) => o.m.tag_ids.includes(view.id)) && <div className="empty">nada com essa tag neste mês</div>}
          </div>
        </Modal>
      )}
      {del && <Confirm title="excluir tag" text={`A tag “${del.nome}” sai de todas as movimentações. As movimentações continuam.`} okLabel="excluir tag" onOk={() => deleteTag(del.id)} onClose={() => setDel(null)} />}
    </>
  );
}
