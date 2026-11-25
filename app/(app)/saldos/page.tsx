"use client";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/Badge";
import { TopBar } from "@/components/MonthNav";
import { KINDS, KN, MES, MS, addM, brl, compute, dim, endOf, periodMonths, prevDia, sem, todayStr, ym } from "@/lib/engine";
import { useStore } from "@/lib/store";
import type { Tipo } from "@/lib/types";

export default function SaldosPage() {
  const { data, openMovForm, setDrawer, toggleCheckin } = useStore();
  const today = todayStr();
  const [per, setPer] = useState(ym(today));
  const months = periodMonths(per);
  const c = useMemo(() => (data ? compute(data, endOf(months[11]), today) : null), [data, months[11], today]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const go = () => {
      if (location.hash !== "#hoje") return;
      setPer(ym(today));
      setTimeout(() => document.getElementById("r-" + today)?.scrollIntoView({ block: "center" }), 50);
      history.replaceState(null, "", "/saldos");
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [today]);

  if (!data || !c) return null;
  const [y0, m0] = months[0].split("-").map(Number);
  const [y1, m1] = months[11].split("-").map(Number);
  const nav = (n: number) => setPer(ym(addM(per + "-01", n)));
  const empty = !data.movs.length && !data.config.data_saldo_inicial;

  return (
    <>
      <TopBar title="saldos">
        <button className="ib yr" aria-label="Ano anterior" onClick={() => nav(-12)}>«</button>
        <button className="ib" aria-label="Mês anterior" onClick={() => nav(-1)}>‹</button>
        <span className="pill">{MS[m0 - 1]}/{y0} – {MS[m1 - 1]}/{y1}</span>
        <button className="ib" aria-label="Próximo mês" onClick={() => nav(1)}>›</button>
        <button className="ib yr" aria-label="Próximo ano" onClick={() => nav(12)}>»</button>
      </TopBar>
      <div className="wrap">
        {empty && (
          <div className="card welcome">
            <h3>Comece por aqui</h3>
            <p className="hint">Defina o saldo que você tem hoje em <b>menu → configurações → saldo inicial</b> e vá lançando as movimentações. Se você usou o protótipo, dá para restaurar o backup dele em configurações.</p>
          </div>
        )}
        {months.map((M) => {
          const [y, m] = M.split("-").map(Number);
          const n = dim(y, m - 1);
          const tot: Record<Tipo, number> = { E: 0, S: 0, D: 0, Eco: 0, C: 0 };
          const rows = Array.from({ length: n }, (_, i) => {
            const ds = `${M}-${String(i + 1).padStart(2, "0")}`;
            const r = c.day.get(ds);
            const b = c.bal.get(ds);
            const pd = ds > today ? prevDia(data.prev, data.config.previsao_divisor, ds) : 0;
            return (
              <tr key={ds} id={"r-" + ds} className={(ds === today ? "today " : "") + (data.checkins.has(ds) ? "ck" : "")}>
                <td><button className="daybtn" aria-label={`Check-in do dia ${i + 1}`} onClick={() => toggleCheckin(ds)}>{i + 1}</button></td>
                {KINDS.map(({ k }) => {
                  const v = r?.[k] ?? 0;
                  tot[k] += v;
                  return (
                    <td className="v" key={k}>
                      <div className="cell">
                        <button aria-label={`Adicionar ${KN[k].nome} em ${i + 1}/${m}`} onClick={() => openMovForm({ tipo: k, data: ds })}><Badge k={k} off={!v} /></button>
                        <button className="amt" onClick={() => setDrawer({ date: ds, kind: k })}>
                          {v ? brl(v) : k === "D" && pd ? <span className="dash">~{brl(pd)}</span> : <span className="zero">{brl(0)}</span>}
                        </button>
                      </div>
                    </td>
                  );
                })}
                {b === undefined ? <td className="bal" style={{ color: "var(--mute)" }}>—</td> : <td className="bal" style={{ background: `var(--${sem(b)})` }}>{brl(b)}</td>}
              </tr>
            );
          });
          return (
            <section key={M}>
              <h2>{MES[m - 1]} de {y}</h2>
              <div className="tw">
                <table className="led">
                  <thead><tr><th>dia</th>{KINDS.map((k) => <th key={k.k}><div className="cell"><Badge k={k.k} /><span>{k.plural}</span></div></th>)}<th>saldo</th></tr></thead>
                  <tbody>{rows}</tbody>
                  <tfoot><tr><td />{KINDS.map((k) => <td className="v" key={k.k}><div className="cell"><Badge k={k.k} /><span>{brl(tot[k.k])}</span></div></td>)}<td /></tr></tfoot>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
