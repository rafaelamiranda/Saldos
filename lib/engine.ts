import type { Cartao, Config, Data, Mov, Occ, PrevItem, Repeticao, Sums, Tipo } from "./types";

export const KINDS: { k: Tipo; nome: string; plural: string; dica: string }[] = [
  { k: "E", nome: "entrada", plural: "entradas", dica: "salário, comissão, vales" },
  { k: "S", nome: "saída", plural: "saídas", dica: "gastos fixos, boletos, aluguel" },
  { k: "D", nome: "diário", plural: "diários", dica: "gastos variáveis, compras" },
  { k: "Eco", nome: "economia", plural: "economias", dica: "reserva, investimento" },
  { k: "C", nome: "gastos com cartão", plural: "cartão", dica: "gastos ou total da fatura" },
];
export const KN = Object.fromEntries(KINDS.map((k) => [k.k, k])) as Record<Tipo, (typeof KINDS)[number]>;
export const REPS: { r: Repeticao; nome: string; dica: string }[] = [
  { r: "none", nome: "não repete", dica: "" },
  { r: "mensal", nome: "mensalmente", dica: "repete o mesmo valor todo mês" },
  { r: "semanal", nome: "semanalmente", dica: "repete o mesmo valor toda semana" },
  { r: "diario", nome: "diariamente", dica: "repete o mesmo valor todo dia" },
  { r: "parcelado", nome: "parcelado", dica: "divide o valor pelo número de parcelas" },
];
export const TAGCOLORS = ["#6b4fbb", "#c0394b", "#2f8f6f", "#c2416a", "#3b6fc4", "#b8862b", "#7a7a80", "#d4652a", "#2a9bb3"];
export const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const MS = MES.map((m) => m.slice(0, 3));

export const r2 = (v: number) => Math.round(v * 100) / 100;
export const brl = (v: number) =>
  "R$ " + r2(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const kfmt = (v: number) =>
  Math.abs(v) >= 1000
    ? (v / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "k"
    : v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const parseNum = (s: string | number) => {
  let t = String(s ?? "").replace(/[^\d,.-]/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  return r2(parseFloat(t) || 0);
};
export const fmtInput = (v: number | string) => (v === "" ? "" : String(v).replace(".", ","));

export const P = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
export const F = (d: Date) => d.toISOString().slice(0, 10);
export const addD = (s: string, n: number) => {
  const d = P(s);
  d.setUTCDate(d.getUTCDate() + n);
  return F(d);
};
export const dim = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
export const addM = (s: string, n: number) => {
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  return F(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), Math.min(d, dim(t.getUTCFullYear(), t.getUTCMonth())))));
};
export const todayStr = () => {
  const n = new Date();
  return F(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())));
};
export const ym = (s: string) => s.slice(0, 7);
export const endOf = (M: string) => {
  const [y, m] = M.split("-").map(Number);
  return `${M}-${String(dim(y, m - 1)).padStart(2, "0")}`;
};
export const periodMonths = (per: string, n = 12) =>
  Array.from({ length: n }, (_, i) => ym(addM(per + "-01", i)));
export const sem = (v: number) => (v < -500 ? "lowest" : v < 0 ? "low" : v <= 1000 ? "base" : v <= 2000 ? "high" : "highest");

/** Expande uma movimentação em ocorrências até a data `to`. */
export function occ(m: Mov, to: string): Occ[] {
  const out: Occ[] = [];
  const ex = new Set(m.excecoes || []);
  const n = Number(m.vezes) || 0;
  const valor = Number(m.valor);
  const push = (d: string, v: number, i?: number, t?: number) => {
    if (d <= to && !ex.has(d)) out.push({ m, d, v, i, t });
  };
  if (m.repeticao === "parcelado") {
    const k = Math.max(1, n || 1);
    const base = Math.floor((valor / k) * 100) / 100;
    for (let i = 0; i < k; i++) {
      const d = addM(m.data, i);
      if (d > to) break;
      push(d, i === k - 1 ? r2(valor - base * (k - 1)) : base, i + 1, k);
    }
    return out;
  }
  if (!m.repeticao || m.repeticao === "none") {
    push(m.data, valor);
    return out;
  }
  for (let i = 0; ; i++) {
    if (n && i >= n) break;
    const d =
      m.repeticao === "mensal" ? addM(m.data, i) : addD(m.data, i * (m.repeticao === "semanal" ? 7 : 1));
    if (d > to) break;
    push(d, valor, i + 1, n || 0);
  }
  return out;
}

export function prevDia(itens: PrevItem[], div: Config["previsao_divisor"], d: string) {
  const t = itens.reduce((a, b) => a + (Number(b.valor) || 0), 0);
  if (!t) return 0;
  if (div === "mes") {
    const x = P(d);
    return t / dim(x.getUTCFullYear(), x.getUTCMonth());
  }
  return t / 30;
}

export interface Computed {
  day: Map<string, Sums>;
  list: Occ[];
  bal: Map<string, number>;
  end: string;
}
const zero = (): Sums => ({ E: 0, S: 0, D: 0, Eco: 0, C: 0 });

/** Somas por dia, lista de ocorrências e saldo acumulado até `end`. */
export function compute(data: Data, end: string, today = todayStr()): Computed {
  const day = new Map<string, Sums>();
  const list: Occ[] = [];
  for (const m of data.movs)
    for (const o of occ(m, end)) {
      list.push(o);
      let r = day.get(o.d);
      if (!r) day.set(o.d, (r = zero()));
      r[o.m.tipo] += o.v;
    }
  list.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  const cfg = data.config;
  let from = cfg.data_saldo_inicial;
  if (!from) from = list.length ? addD(list[0].d, -1) : addD(today, -1);
  const bal = new Map<string, number>();
  let b = cfg.data_saldo_inicial ? Number(cfg.saldo_inicial) || 0 : 0;
  for (let d = addD(from, 1); d <= end; d = addD(d, 1)) {
    const r = day.get(d);
    if (r) b += r.E - r.S - r.D - r.Eco - r.C;
    if (d > today) b -= prevDia(data.prev, cfg.previsao_divisor, d);
    bal.set(d, r2(b));
  }
  return { day, list, bal, end };
}

export function sumsMonth(c: Computed, M: string): Sums {
  const t = zero();
  for (const [d, r] of c.day) if (ym(d) === M) for (const k of Object.keys(t) as Tipo[]) t[k] += r[k];
  return t;
}

/** Data de vencimento da fatura em que cai uma compra feita em `data`. */
export function dueDate(c: Cartao, data: string) {
  let base = data.slice(0, 8) + "01";
  if (+data.slice(8) > c.fechamento) base = addM(base, 1);
  if (c.vencimento <= c.fechamento) base = addM(base, 1);
  const y = +base.slice(0, 4), mo = +base.slice(5, 7);
  return base.slice(0, 8) + String(Math.min(c.vencimento, dim(y, mo - 1))).padStart(2, "0");
}
