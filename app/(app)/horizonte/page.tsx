"use client";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/MonthNav";
import { MS, addM, compute, dim, endOf, kfmt, periodMonths, sem, todayStr, ym } from "@/lib/engine";
import { useStore } from "@/lib/store";

export default function HorizontePage() {
  const { data } = useStore();
  const today = todayStr();
  const [per, setPer] = useState(ym(today));
  const months = periodMonths(per);
  const c = useMemo(() => (data ? compute(data, endOf(months[11]), today) : null), [data, months[11], today]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!c) return null;
  return (
    <>
      <TopBar title="horizonte de saldos">
        <button className="ib" aria-label="Mês anterior" onClick={() => setPer(ym(addM(per + "-01", -1)))}>‹</button>
        <button className="ib" aria-label="Próximo mês" onClick={() => setPer(ym(addM(per + "-01", 1)))}>›</button>
      </TopBar>
      <div className="wrap">
        <div className="legend">
          <span><i style={{ background: "var(--lowest)" }} />abaixo de −500</span><span><i style={{ background: "var(--low)" }} />negativo</span>
          <span><i style={{ background: "var(--base)" }} />até 1.000</span><span><i style={{ background: "var(--high)" }} />até 2.000</span>
          <span><i style={{ background: "var(--highest)" }} />acima de 2.000</span>
        </div>
        <div className="hz">
          {months.map((M) => {
            const [y, m] = M.split("-").map(Number);
            const n = dim(y, m - 1);
            return (
              <div className="mc" key={M}>
                <div className="mh">{MS[m - 1]}/{String(y).slice(2)}</div>
                {Array.from({ length: 31 }, (_, i) => {
                  const d = i + 1;
                  if (d > n) return <div className="hd" key={d}><b /><span /></div>;
                  const ds = `${M}-${String(d).padStart(2, "0")}`;
                  const b = c.bal.get(ds);
                  return (
                    <div className={"hd" + (ds === today ? " tod" : "")} key={d}>
                      <b>{d}</b>
                      <span style={{ background: b === undefined ? "transparent" : `var(--${sem(b)})` }}>{b === undefined ? "" : kfmt(b)}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
