/** Lista de e-mails autorizados (ALLOWED_EMAILS, separados por vírgula). Vazia = qualquer usuário do projeto. */
export function isAllowed(email: string | null | undefined): boolean {
  const list = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!list.length) return true;
  return !!email && list.includes(email.toLowerCase());
}
