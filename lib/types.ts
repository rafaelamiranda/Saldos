export type Tipo = "E" | "S" | "D" | "Eco" | "C";
export type Repeticao = "none" | "mensal" | "semanal" | "diario" | "parcelado";

export interface Mov {
  id: string;
  tipo: Tipo;
  valor: number;
  descricao: string;
  data: string; // YYYY-MM-DD
  repeticao: Repeticao;
  vezes: number; // 0 = sem fim (ou 1 parcela)
  tag_ids: string[];
  cartao_id: string | null;
  excecoes: string[];
}
export interface Tag { id: string; nome: string; cor: string }
export interface Cartao { id: string; nome: string; fechamento: number; vencimento: number }
export interface PrevItem { id: string; nome: string; valor: number }
export interface Config {
  saldo_inicial: number | null;
  data_saldo_inicial: string | null;
  previsao_divisor: "30" | "mes";
  tema: "claro" | "escuro" | "sistema";
}
export interface Data {
  movs: Mov[];
  tags: Tag[];
  cartoes: Cartao[];
  prev: PrevItem[];
  config: Config;
  checkins: Set<string>;
}
export type Sums = Record<Tipo, number>;
export interface Occ { m: Mov; d: string; v: number; i?: number; t?: number }
