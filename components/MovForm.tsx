"use client";
import { useState } from "react";
import { Modal } from "./Modal";
import { Badge } from "./Badge";
import { KINDS, KN, REPS, dueDate, fmtInput, parseNum, todayStr } from "@/lib/engine";
import { useStore } from "@/lib/store";
import type { Repeticao, Tipo } from "@/lib/types";

export function MovForm() {
  const { movForm, closeMovForm, saveMov, data } = useStore();
  const m = movForm?.mov;
  const isNew = !m;
  const [tipo, setTipo] = useState<Tipo>(m?.tipo ?? movForm?.tipo ?? "E");
  const [valor, setValor] = useState(m ? fmtInput(m.valor) : "");
  const [desc, setDesc] = useState(m?.descricao ?? "");
  const [date, setDate] = useState(m?.data ?? movForm?.data ?? todayStr());
  const [rep, setRep] = useState<Repeticao>(m?.repeticao ?? "none");
  const [vezes, setVezes] = useState(m?.vezes ? String(m.vezes) : "");
  const [tags, setTags] = useState<string[]>(m?.tag_ids ?? []);
  const [cartao, setCartao] = useState(m?.cartao_id ?? "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (!movForm || !data) return null;

  const submit = async () => {
    const v = parseNum(valor);
    if (!(v > 0)) return setErr("informe um valor maior que zero");
    if (!date) return setErr("informe a data");
    let n = rep === "none" ? 0 : Math.max(0, parseInt(vezes) || 0);
    if (rep === "parcelado" && n < 2) n = 2;
    setBusy(true);
    const ok = await saveMov({
      id: m?.id, tipo, valor: v, descricao: desc.trim(), data: date, repeticao: rep, vezes: n,
      tag_ids: tags, cartao_id: tipo === "C" ? cartao || null : null, excecoes: m?.excecoes ?? [],
    });
    setBusy(false);
    if (ok) closeMovForm();
  };
  const card = data.cartoes.find((c) => c.id === cartao);

  return (
    <Modal title={isNew ? "adicionar" : "editar"} onClose={closeMovForm}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="fld"><label htmlFor="fV">valor</label><input id="fV" inputMode="decimal" placeholder="R$ 0,00" value={valor} onChange={(e) => setValor(e.target.value)} /></div>
        <div className="fld"><label htmlFor="fT">tipo</label><Badge k={tipo} />
          <select id="fT" value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)}>
            {KINDS.map((k) => <option key={k.k} value={k.k}>{k.nome} — {k.dica}</option>)}
          </select></div>
        <div className="fld"><label htmlFor="fN">descrição</label><input id="fN" maxLength={200} placeholder={KN[tipo].nome} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        {tipo === "C" && (
          <div className="fld"><label htmlFor="fK">cartão</label>
            <select id="fK" value={cartao} onChange={(e) => setCartao(e.target.value)}>
              <option value="">—</option>
              {data.cartoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {card && <button type="button" className="lnk" onClick={() => setDate(dueDate(card, date))}>usar vencimento</button>}
          </div>
        )}
        <div className="fld"><label htmlFor="fD">data</label><input id="fD" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="fld"><label htmlFor="fR">repete</label>
          <select id="fR" value={rep} onChange={(e) => setRep(e.target.value as Repeticao)}>
            {REPS.map((r) => <option key={r.r} value={r.r}>{r.nome}{r.dica ? " — " + r.dica : ""}</option>)}
          </select></div>
        {rep !== "none" && (
          <div className="fld"><label htmlFor="fQ">{rep === "parcelado" ? "parcelas" : "quantas vezes"}</label>
            <input id="fQ" inputMode="numeric" placeholder={rep === "parcelado" ? "2" : "vazio = a perder de vista"} value={vezes} onChange={(e) => setVezes(e.target.value.replace(/\D/g, ""))} /></div>
        )}
        <div className="tagpick" aria-label="Tags">
          {data.tags.length ? data.tags.map((t) => {
            const on = tags.includes(t.id);
            return <button type="button" key={t.id} className={on ? "on" : ""} style={on ? { background: t.cor } : undefined}
              onClick={() => setTags(on ? tags.filter((x) => x !== t.id) : [...tags, t.id])}>{t.nome}</button>;
          }) : <span className="hint" style={{ margin: 0 }}>sem tags ainda — crie em “tags”</span>}
        </div>
        {!isNew && m!.repeticao !== "none" && <p className="hint">Mudanças valem para toda a série.</p>}
        {err && <p className="hint" style={{ color: "var(--S)" }}>{err}</p>}
        <button className="btn" disabled={busy} style={{ background: `var(--${tipo})` }}>
          {busy ? "salvando…" : isNew ? "adicionar " + KN[tipo].nome : "salvar"}
        </button>
      </form>
    </Modal>
  );
}
