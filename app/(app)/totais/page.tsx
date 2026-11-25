"use client";
import { useMemo, useState } from "react";
import { Badge, ForecastBadge } from "@/components/Badge";
import { ItemRow } from "@/components/ItemRow";
import { MonthNav, TopBar } from "@/components/MonthNav";
import { KINDS, brl, compute, dim, endOf, prevDia, sumsMonth, todayStr, ym } from "@/lib/engine";
import { useStore } from "@/lib/store";

export default function TotaisPage() {
  const { data } = useStore();
  const today = todayStr();
  const [mon, setMon] = useState(ym(today));
  const c = useMemo(() => (data ? compute(data, endOf(mon), today) : null), [data, mon, today]);
  if (!data || !c) return null;
  const [y, m] = mon.split("-").map(Number);
  const n = dim(y, m - 1);
  const t = sumsMonth(c, mon);
  const cur = ym(today);
  const left = mon === cur ? n - +today.slice(8) : mon > cur ? n : 0;
  const el = mon === cur ? +today.slice(8) : mon < cur ? n : 0;
  const pd = prevDia(data.prev, data.config.previsao_divisor, mon + "-01");
  const pt = pd * left;
  const perf = t.E - t.S - t.D - t.Eco - t.C - pt;
  const eco = t.E ? t.Eco / t.E : 0;
  const custo = t.S + t.D + t.C + pt;
  const movs = c.list.filter((o) => ym(o.d) === mon);
  const pct = (eco * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      <TopBar title="totais"><MonthNav value={mon} onChange={setMon} /></TopBar>
      <div className="wrap">
        <div className="sub">cálculos do mês</div>
        <div className="grid">
          <div className="card"><h3>performance</h3>
            <div className="formula"><Badge k="E" />−<Badge k="S" />−<Badge k="D" />−<Badge k="Eco" />−<Badge k="C" />−<ForecastBadge /></div>
            <div className={"big " + (perf < 0 ? "neg" : "pos")}>{brl(perf)}</div><div className="hint">{perf < 0 ? "faltou dinheiro" : "sobrou dinheiro"}</div></div>
          <div className="card"><h3>economizado</h3>
            <div className="formula"><Badge k="Eco" /><span className="meter"><i style={{ width: Math.min(100, eco * 100) + "%" }} /></span><Badge k="E" /></div>
            <div className="big">{pct}%</div><div className="hint">{t.Eco ? brl(t.Eco) + " guardados" : "nada guardado"}</div></div>
          <div className="card"><h3>custo de vida</h3>
            <div className="formula"><Badge k="S" />+<Badge k="D" />+<Badge k="C" />+<ForecastBadge /></div>
            <div className="big">{brl(custo)}</div><div className="hint">{custo > t.E ? "acima da renda" : "dentro da renda"}</div></div>
          <div className="card"><h3>diário médio</h3>
            <div className="formula"><Badge k="D" /> / {el || "—"}</div>
            <div className="big">{el ? brl(t.D / el) : "—"}</div><div className="hint">previsão por dia: {brl(pd)}</div></div>
        </div>
        <div className="sub">movimentações do mês</div>
        <div className="list">{KINDS.map((k) => <div className="row" key={k.k}><Badge k={k.k} /><b>{k.plural}</b><span className="r">{brl(t[k.k])}</span></div>)}</div>
        <div className="sub">previsão de diários do mês</div>
        <div className="list"><div className="row"><ForecastBadge /><span className="grow">previsão de diário × {left} dias restantes</span><span className="r">{brl(pt)}</span></div></div>
        <div className="sub">todas as movimentações ({movs.length})</div>
        <div className="list">{movs.length ? movs.map((o) => <ItemRow key={o.m.id + o.d} o={o} />) : <div className="empty">nenhuma movimentação neste mês</div>}</div>
      </div>
    </>
  );
}
