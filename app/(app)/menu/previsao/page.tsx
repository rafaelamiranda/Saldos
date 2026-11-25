"use client";
import Link from "next/link";
import { TopBar } from "@/components/MonthNav";
import { brl, fmtInput, parseNum, prevDia, todayStr } from "@/lib/engine";
import { useStore } from "@/lib/store";

export default function PrevisaoPage() {
  const { data, addPrev, updatePrev, deletePrev, saveConfig } = useStore();
  if (!data) return null;
  const total = data.prev.reduce((a, b) => a + b.valor, 0);
  return (
    <>
      <TopBar title={<><Link href="/menu" className="ib back" aria-label="Voltar">←</Link> previsão de diário</>} />
      <div className="wrap narrow">
        <div className="sub">gastos mensais que viram diário (mercado, padaria, lazer…)</div>
        <div className="list">
          {data.prev.length ? data.prev.map((i) => (
            <div className="row" key={i.id}>
              <input className="inp bare" aria-label="Nome" defaultValue={i.nome} maxLength={60} onBlur={(e) => e.target.value !== i.nome && updatePrev(i.id, { nome: e.target.value })} />
              <input className="inp bare num" aria-label="Valor" inputMode="decimal" defaultValue={fmtInput(i.valor)} onBlur={(e) => { const v = parseNum(e.target.value); if (v !== i.valor) updatePrev(i.id, { valor: v }); }} />
              <button className="ib" aria-label="Remover" onClick={() => deletePrev(i.id)}>×</button>
            </div>
          )) : <div className="empty">nenhum gasto mensal cadastrado</div>}
        </div>
        <button className="btn ghost" onClick={addPrev}>adicionar gasto mensal</button>
        <div className="card" style={{ marginTop: 16 }}>
          <div className="row" style={{ padding: 0 }}><span>total mensal</span><span className="r">{brl(total)}</span></div>
          <div className="row" style={{ padding: 0 }}><span>dividido por</span>
            <select className="inp r" style={{ width: 160 }} value={data.config.previsao_divisor} onChange={(e) => saveConfig({ previsao_divisor: e.target.value as "30" | "mes" })}>
              <option value="30">30 dias</option><option value="mes">dias do mês</option>
            </select></div>
          <div className="row" style={{ padding: 0, border: 0 }}><b>por dia</b><b className="r" style={{ fontSize: 20 }}>{brl(prevDia(data.prev, data.config.previsao_divisor, todayStr()))}</b></div>
        </div>
        <p className="hint">A previsão é descontada dos saldos nos dias futuros (aparece tracejada na coluna diários) e entra na performance e no custo de vida.</p>
      </div>
    </>
  );
}
