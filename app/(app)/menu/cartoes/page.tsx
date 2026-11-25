"use client";
import Link from "next/link";
import { useState } from "react";
import { Confirm, Modal } from "@/components/Modal";
import { TopBar } from "@/components/MonthNav";
import { useStore } from "@/lib/store";
import type { Cartao } from "@/lib/types";

function CartaoForm({ c, onClose }: { c: Cartao | null; onClose: () => void }) {
  const { saveCartao } = useStore();
  const [nome, setNome] = useState(c?.nome ?? "");
  const [f, setF] = useState(String(c?.fechamento ?? 1));
  const [v, setV] = useState(String(c?.vencimento ?? 10));
  const clamp = (s: string) => Math.min(31, Math.max(1, parseInt(s) || 1));
  return (
    <Modal title={c ? "editar cartão" : "novo cartão"} onClose={onClose}>
      <form onSubmit={async (e) => { e.preventDefault(); if (!nome.trim()) return; await saveCartao({ id: c?.id, nome: nome.trim(), fechamento: clamp(f), vencimento: clamp(v) }); onClose(); }}>
        <div className="fld"><label htmlFor="cN">nome</label><input id="cN" maxLength={60} value={nome} onChange={(e) => setNome(e.target.value)} /></div>
        <div className="fld"><label htmlFor="cF">fechamento</label><input id="cF" inputMode="numeric" value={f} onChange={(e) => setF(e.target.value)} /></div>
        <div className="fld"><label htmlFor="cV">vencimento</label><input id="cV" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} /></div>
        <button className="btn">salvar</button>
      </form>
    </Modal>
  );
}

export default function CartoesPage() {
  const { data, deleteCartao } = useStore();
  const [edit, setEdit] = useState<Cartao | null | undefined>(undefined);
  const [del, setDel] = useState<Cartao | null>(null);
  if (!data) return null;
  return (
    <>
      <TopBar title={<><Link href="/menu" className="ib back" aria-label="Voltar">←</Link> cartões de crédito</>} />
      <div className="wrap narrow">
        <div className="list">
          {data.cartoes.length ? data.cartoes.map((c) => (
            <div className="row" key={c.id}>
              <div className="grow"><b>{c.nome}</b><div className="hint" style={{ margin: 0 }}>fecha dia {c.fechamento} · vence dia {c.vencimento}</div></div>
              <button className="ib" aria-label="Editar" onClick={() => setEdit(c)}>✎</button>
              <button className="ib" aria-label="Excluir" onClick={() => setDel(c)}>×</button>
            </div>
          )) : <div className="empty">nenhum cartão</div>}
        </div>
        <button className="btn ghost" onClick={() => setEdit(null)}>adicionar cartão</button>
      </div>
      {edit !== undefined && <CartaoForm c={edit} onClose={() => setEdit(undefined)} />}
      {del && <Confirm title="excluir cartão" text={`Os gastos ligados ao ${del.nome} continuam, só sem cartão.`} okLabel="excluir cartão" onOk={() => deleteCartao(del.id)} onClose={() => setDel(null)} />}
    </>
  );
}
