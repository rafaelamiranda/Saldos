"use client";
import Link from "next/link";
import { useState } from "react";
import { Confirm, Modal } from "@/components/Modal";
import { TopBar } from "@/components/MonthNav";
import { addD, fmtInput, parseNum, todayStr } from "@/lib/engine";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";

export default function ConfigPage() {
  const { data, saveConfig, importBackup, resetAll, toast } = useStore();
  const [iniV, setIniV] = useState(data?.config.saldo_inicial != null ? fmtInput(data.config.saldo_inicial) : "");
  const [iniD, setIniD] = useState(data?.config.data_saldo_inicial ?? addD(todayStr(), -1));
  const [imp, setImp] = useState(false);
  const [impTxt, setImpTxt] = useState("");
  const [impErr, setImpErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [zerar, setZerar] = useState(false);
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [sErr, setSErr] = useState("");
  if (!data) return null;

  const exportar = () => {
    const blob = new Blob([JSON.stringify({ ...data, checkins: [...data.checkins] }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `meus-saldos-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const trocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setSErr("");
    if (s1.length < 10) return setSErr("use pelo menos 10 caracteres");
    if (s1 !== s2) return setSErr("as senhas não conferem");
    const { error } = await createClient().auth.updateUser({ password: s1 });
    if (error) return setSErr(error.message);
    setS1(""); setS2("");
    toast("senha alterada");
  };

  return (
    <>
      <TopBar title={<><Link href="/menu" className="ib back" aria-label="Voltar">←</Link> configurações</>} />
      <div className="wrap narrow">
        <div className="sub">aparência</div>
        <div className="list">
          {([["claro", "modo claro"], ["escuro", "modo escuro"], ["sistema", "usar configuração do sistema"]] as const).map(([v, l]) => (
            <button key={v} className="row" style={{ width: "100%" }} onClick={() => saveConfig({ tema: v })}>
              <span className="grow" style={{ textAlign: "left" }}>{l}</span>{data.config.tema === v ? "✓" : ""}
            </button>
          ))}
        </div>

        <div className="sub">saldo inicial</div>
        <form className="card" onSubmit={(e) => { e.preventDefault(); saveConfig({ saldo_inicial: parseNum(iniV), data_saldo_inicial: iniD }).then(() => toast("saldo inicial salvo")); }}>
          <p className="hint" style={{ marginTop: 0 }}>Quanto havia na conta no fim de um dia. Os saldos são calculados a partir do dia seguinte.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input className="inp" style={{ flex: "1 1 140px" }} aria-label="Valor" inputMode="decimal" placeholder="R$ 0,00" value={iniV} onChange={(e) => setIniV(e.target.value)} />
            <input className="inp" style={{ flex: "1 1 160px" }} aria-label="Data" type="date" value={iniD} onChange={(e) => setIniD(e.target.value)} />
            <button className="btn" style={{ width: "auto", margin: 0, padding: "0 20px" }}>salvar</button>
          </div>
        </form>

        <div className="sub">trocar senha</div>
        <form className="card" onSubmit={trocarSenha}>
          <input className="inp" type="password" autoComplete="new-password" placeholder="nova senha" aria-label="Nova senha" value={s1} onChange={(e) => setS1(e.target.value)} />
          <input className="inp" style={{ marginTop: 8 }} type="password" autoComplete="new-password" placeholder="repita a nova senha" aria-label="Repita a nova senha" value={s2} onChange={(e) => setS2(e.target.value)} />
          {sErr && <p className="hint" style={{ color: "var(--S)" }}>{sErr}</p>}
          <button className="btn">trocar senha</button>
        </form>

        <div className="sub">meus dados</div>
        <div className="list">
          <button className="row" style={{ width: "100%" }} onClick={exportar}><span className="grow" style={{ textAlign: "left" }}>baixar backup (JSON)</span></button>
          <button className="row" style={{ width: "100%" }} onClick={() => setImp(true)}><span className="grow" style={{ textAlign: "left" }}>importar backup do protótipo</span></button>
          <button className="row" style={{ width: "100%" }} onClick={() => setZerar(true)}><span className="grow" style={{ textAlign: "left", color: "var(--S)" }}>zerar minha conta<br /><small className="hint">apaga movimentações, tags, cartões e previsão</small></span></button>
        </div>
      </div>

      {imp && (
        <Modal title="importar backup" onClose={() => setImp(false)}>
          <p className="hint" style={{ marginTop: 0 }}>No protótipo, vá em menu → configurações → copiar backup e cole aqui. Os dados são somados aos que já existem.</p>
          <textarea className="inp mono" value={impTxt} onChange={(e) => setImpTxt(e.target.value)} placeholder="cole aqui o JSON" />
          {impErr && <p className="hint" style={{ color: "var(--S)" }}>{impErr}</p>}
          <button className="btn" disabled={busy} onClick={async () => { setBusy(true); const r = await importBackup(impTxt); setBusy(false); if (r) setImpErr(r); else { setImp(false); toast("backup importado"); } }}>{busy ? "importando…" : "importar"}</button>
        </Modal>
      )}
      {zerar && <Confirm title="zerar minha conta" text="Apaga todas as movimentações, tags, cartões, previsão e o saldo inicial. Não dá para desfazer — baixe um backup antes." okLabel="zerar tudo" onOk={resetAll} onClose={() => setZerar(false)} />}
    </>
  );
}
