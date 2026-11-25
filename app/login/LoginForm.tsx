"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ERROS: Record<string, string> = {
  acesso: "Este e-mail não tem acesso ao sistema.",
  link: "O link expirou ou é inválido. Peça outro.",
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [err, setErr] = useState(ERROS[params.get("erro") ?? ""] ?? "");
  const [busy, setBusy] = useState(false);
  const [modo, setModo] = useState<"entrar" | "esqueci">("entrar");
  const [ok, setOk] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setOk(""); setBusy(true);
    const sb = createClient();
    if (modo === "entrar") {
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: senha });
      setBusy(false);
      if (error) return setErr(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
      router.replace("/saldos");
      router.refresh();
    } else {
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/auth/callback?next=/menu/configuracoes` });
      setBusy(false);
      if (error) return setErr(error.message);
      setOk("Se o e-mail estiver cadastrado, você vai receber um link para trocar a senha.");
    }
  };

  return (
    <form onSubmit={submit}>
      <h1 style={{ fontSize: 26, margin: "0 0 4px" }}>{modo === "entrar" ? "Entrar" : "Recuperar senha"}</h1>
      <p className="hint" style={{ marginTop: 0 }}>Acesso restrito.</p>
      <label className="lbl" htmlFor="email">e-mail</label>
      <input className="inp" id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      {modo === "entrar" && (
        <>
          <label className="lbl" htmlFor="senha">senha</label>
          <input className="inp" id="senha" type="password" autoComplete="current-password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} />
        </>
      )}
      {err && <p className="hint" role="alert" style={{ color: "var(--S)" }}>{err}</p>}
      {ok && <p className="hint" role="status">{ok}</p>}
      <button className="btn" disabled={busy}>{busy ? "aguarde…" : modo === "entrar" ? "entrar" : "enviar link"}</button>
      <button type="button" className="lnk" style={{ marginTop: 14 }} onClick={() => { setModo(modo === "entrar" ? "esqueci" : "entrar"); setErr(""); setOk(""); }}>
        {modo === "entrar" ? "esqueci minha senha" : "voltar para o login"}
      </button>
    </form>
  );
}
