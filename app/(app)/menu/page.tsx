"use client";
import Link from "next/link";
import { TopBar } from "@/components/MonthNav";
import { useStore } from "@/lib/store";

export default function MenuPage() {
  const { data, openMovForm } = useStore();
  const items = [
    ["/menu/previsao", "previsão de diário"],
    ["/menu/cartoes", "cartões de crédito"],
    ["/menu/configuracoes", "configurações, senha e backup"],
  ];
  return (
    <>
      <TopBar title="menu" />
      <div className="wrap narrow">
        <div className="list">
          {items.map(([h, l]) => <Link key={h} href={h} className="row"><span className="grow">{l}</span>›</Link>)}
          <button className="row" style={{ width: "100%" }} onClick={() => openMovForm({})}><span className="grow" style={{ textAlign: "left" }}>adicionar movimentação</span>+</button>
          <Link href="/saldos#hoje" className="row"><span className="grow">ir pra hoje</span>›</Link>
          <form action="/auth/signout" method="post"><button className="row" style={{ width: "100%" }}><span className="grow" style={{ textAlign: "left", color: "var(--S)" }}>sair</span></button></form>
        </div>
        {data && <p className="hint">{data.movs.length} lançamentos · {data.tags.length} tags · {data.cartoes.length} cartões</p>}
      </div>
    </>
  );
}
