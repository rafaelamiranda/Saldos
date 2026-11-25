import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "entrar · meus saldos" };

export default function LoginPage() {
  return (
    <div className="login">
      <div className="card loginCard">
        <div className="logo" style={{ padding: 0, marginBottom: 18 }}>
          <svg width="30" height="26" viewBox="0 0 26 22" aria-hidden><rect x="1" y="12" width="5" height="9" rx="1.5" fill="var(--S)" /><rect x="8" y="7" width="5" height="14" rx="1.5" fill="var(--D)" /><rect x="15" y="3" width="5" height="18" rx="1.5" fill="var(--acc)" /><rect x="22" y="9" width="3" height="12" rx="1.5" fill="var(--E)" /></svg>
          <span style={{ fontSize: 20 }}>meus saldos</span>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
