"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Cartao, Config, Data, Mov, PrevItem, Tag, Tipo } from "@/lib/types";

const DEFAULT_CONFIG: Config = { saldo_inicial: null, data_saldo_inicial: null, previsao_divisor: "30", tema: "sistema" };

type MovDraft = Omit<Mov, "id"> & { id?: string };
export interface MovFormState { mov?: Mov; tipo?: Tipo; data?: string }
export interface DrawerState { date: string; kind: Tipo | "" }

interface StoreValue {
  data: Data | null;
  error: string | null;
  reload: () => Promise<void>;
  saveMov: (m: MovDraft) => Promise<boolean>;
  deleteMov: (id: string) => Promise<void>;
  duplicateMov: (m: Mov, date: string) => Promise<void>;
  excludeOccurrence: (m: Mov, date: string) => Promise<void>;
  saveTag: (t: Partial<Tag> & { nome: string; cor: string }) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  saveCartao: (c: Partial<Cartao> & Omit<Cartao, "id">) => Promise<void>;
  deleteCartao: (id: string) => Promise<void>;
  addPrev: () => Promise<void>;
  updatePrev: (id: string, patch: Partial<PrevItem>) => Promise<void>;
  deletePrev: (id: string) => Promise<void>;
  saveConfig: (patch: Partial<Config>) => Promise<void>;
  toggleCheckin: (dia: string) => Promise<void>;
  importBackup: (json: string) => Promise<string>;
  resetAll: () => Promise<void>;
  // UI
  toast: (msg: string, undo?: () => void) => void;
  toastState: { msg: string; undo?: () => void } | null;
  closeToast: () => void;
  movForm: MovFormState | null;
  openMovForm: (s: MovFormState) => void;
  closeMovForm: () => void;
  drawer: DrawerState | null;
  setDrawer: (d: DrawerState | null) => void;
}

const Ctx = createContext<StoreValue | null>(null);
export const useStore = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore fora do StoreProvider");
  return v;
};

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const normMov = (r: Record<string, unknown>): Mov => ({
  id: r.id as string,
  tipo: r.tipo as Tipo,
  valor: num(r.valor),
  descricao: (r.descricao as string) ?? "",
  data: r.data as string,
  repeticao: (r.repeticao as Mov["repeticao"]) ?? "none",
  vezes: num(r.vezes),
  tag_ids: (r.tag_ids as string[]) ?? [],
  cartao_id: (r.cartao_id as string) ?? null,
  excecoes: (r.excecoes as string[]) ?? [],
});
const MOV_COLS = "id,tipo,valor,descricao,data,repeticao,vezes,tag_ids,cartao_id,excecoes";

export function StoreProvider({ children }: { children: ReactNode }) {
  const sb = useMemo(() => createClient(), []);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastState, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);
  const [movForm, setMovForm] = useState<MovFormState | null>(null);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string, undo?: () => void) => {
    setToast({ msg, undo });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const fail = useCallback(
    (e: unknown) => {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "erro";
      toast("não foi possível salvar: " + msg);
    },
    [toast]
  );

  const reload = useCallback(async () => {
    try {
      const [m, t, c, p, cfg, ck] = await Promise.all([
        sb.from("movimentacoes").select(MOV_COLS).order("data"),
        sb.from("tags").select("id,nome,cor").order("nome"),
        sb.from("cartoes").select("id,nome,fechamento,vencimento").order("nome"),
        sb.from("previsao_itens").select("id,nome,valor").order("created_at"),
        sb.from("configuracoes").select("saldo_inicial,data_saldo_inicial,previsao_divisor,tema").maybeSingle(),
        sb.from("checkins").select("dia"),
      ]);
      for (const r of [m, t, c, p, cfg, ck]) if (r.error) throw r.error;
      setData({
        movs: (m.data ?? []).map((r) => normMov(r as Record<string, unknown>)),
        tags: (t.data ?? []) as Tag[],
        cartoes: (c.data ?? []) as Cartao[],
        prev: (p.data ?? []).map((r) => ({ ...(r as PrevItem), valor: num((r as PrevItem).valor) })),
        config: cfg.data
          ? { ...DEFAULT_CONFIG, ...cfg.data, saldo_inicial: cfg.data.saldo_inicial === null ? null : num(cfg.data.saldo_inicial) }
          : DEFAULT_CONFIG,
        checkins: new Set((ck.data ?? []).map((r) => r.dia as string)),
      });
      setError(null);
    } catch (e) {
      setError(e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "erro ao carregar");
    }
  }, [sb]);

  useEffect(() => {
    reload();
  }, [reload]);

  // tema
  useEffect(() => {
    const r = document.documentElement;
    const t = data?.config.tema ?? "sistema";
    if (t === "claro") r.dataset.theme = "light";
    else if (t === "escuro") r.dataset.theme = "dark";
    else delete r.dataset.theme;
  }, [data?.config.tema]);

  const patch = useCallback((fn: (d: Data) => Data) => setData((d) => (d ? fn(d) : d)), []);

  const saveMov = useCallback(
    async (m: MovDraft) => {
      const row = {
        tipo: m.tipo,
        valor: m.valor,
        descricao: m.descricao,
        data: m.data,
        repeticao: m.repeticao,
        vezes: m.vezes,
        tag_ids: m.tag_ids,
        cartao_id: m.tipo === "C" ? m.cartao_id || null : null,
        excecoes: m.excecoes,
      };
      const q = m.id
        ? sb.from("movimentacoes").update(row).eq("id", m.id).select(MOV_COLS).single()
        : sb.from("movimentacoes").insert(row).select(MOV_COLS).single();
      const { data: r, error: e } = await q;
      if (e) {
        fail(e);
        return false;
      }
      const saved = normMov(r as Record<string, unknown>);
      patch((d) => ({ ...d, movs: m.id ? d.movs.map((x) => (x.id === saved.id ? saved : x)) : [...d.movs, saved] }));
      if (m.id) toast("movimentação salva");
      else toast("movimentação adicionada", () => void deleteRaw(saved.id));
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sb, fail, patch, toast]
  );

  const deleteRaw = async (id: string) => {
    const { error: e } = await sb.from("movimentacoes").delete().eq("id", id);
    if (e) return fail(e);
    patch((d) => ({ ...d, movs: d.movs.filter((x) => x.id !== id) }));
  };

  const restoreMov = async (m: Mov) => {
    const { id, ...rest } = m;
    const { data: r, error: e } = await sb.from("movimentacoes").insert({ id, ...rest }).select(MOV_COLS).single();
    if (e) return fail(e);
    patch((d) => ({ ...d, movs: [...d.movs, normMov(r as Record<string, unknown>)] }));
  };

  const deleteMov = async (id: string) => {
    const old = data?.movs.find((x) => x.id === id);
    await deleteRaw(id);
    if (old) toast("movimentação excluída", () => void restoreMov(old));
  };

  const duplicateMov = async (m: Mov, date: string) => {
    await saveMov({ ...m, id: undefined, data: date, repeticao: "none", vezes: 0, excecoes: [] });
  };

  const setExcecoes = async (m: Mov, exc: string[]) => {
    const { error: e } = await sb.from("movimentacoes").update({ excecoes: exc }).eq("id", m.id);
    if (e) return fail(e);
    patch((d) => ({ ...d, movs: d.movs.map((x) => (x.id === m.id ? { ...x, excecoes: exc } : x)) }));
  };
  const excludeOccurrence = async (m: Mov, date: string) => {
    const before = m.excecoes;
    await setExcecoes(m, [...before, date]);
    toast("ocorrência excluída", () => void setExcecoes(m, before));
  };

  const saveTag: StoreValue["saveTag"] = async (t) => {
    const row = { nome: t.nome, cor: t.cor };
    const q = t.id
      ? sb.from("tags").update(row).eq("id", t.id).select("id,nome,cor").single()
      : sb.from("tags").insert(row).select("id,nome,cor").single();
    const { data: r, error: e } = await q;
    if (e) return fail(e);
    const saved = r as Tag;
    patch((d) => ({
      ...d,
      tags: (t.id ? d.tags.map((x) => (x.id === saved.id ? saved : x)) : [...d.tags, saved]).sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt")
      ),
    }));
    toast("tag salva");
  };

  const deleteTag = async (id: string) => {
    if (!data) return;
    const affected = data.movs.filter((m) => m.tag_ids.includes(id));
    for (const m of affected) {
      const { error: e } = await sb.from("movimentacoes").update({ tag_ids: m.tag_ids.filter((x) => x !== id) }).eq("id", m.id);
      if (e) return fail(e);
    }
    const { error: e } = await sb.from("tags").delete().eq("id", id);
    if (e) return fail(e);
    patch((d) => ({
      ...d,
      tags: d.tags.filter((t) => t.id !== id),
      movs: d.movs.map((m) => (m.tag_ids.includes(id) ? { ...m, tag_ids: m.tag_ids.filter((x) => x !== id) } : m)),
    }));
    toast("tag excluída");
  };

  const saveCartao: StoreValue["saveCartao"] = async (c) => {
    const row = { nome: c.nome, fechamento: c.fechamento, vencimento: c.vencimento };
    const q = c.id
      ? sb.from("cartoes").update(row).eq("id", c.id).select("id,nome,fechamento,vencimento").single()
      : sb.from("cartoes").insert(row).select("id,nome,fechamento,vencimento").single();
    const { data: r, error: e } = await q;
    if (e) return fail(e);
    const saved = r as Cartao;
    patch((d) => ({ ...d, cartoes: c.id ? d.cartoes.map((x) => (x.id === saved.id ? saved : x)) : [...d.cartoes, saved] }));
    toast("cartão salvo");
  };
  const deleteCartao = async (id: string) => {
    const { error: e } = await sb.from("cartoes").delete().eq("id", id);
    if (e) return fail(e);
    patch((d) => ({
      ...d,
      cartoes: d.cartoes.filter((c) => c.id !== id),
      movs: d.movs.map((m) => (m.cartao_id === id ? { ...m, cartao_id: null } : m)),
    }));
    toast("cartão excluído");
  };

  const addPrev = async () => {
    const { data: r, error: e } = await sb.from("previsao_itens").insert({ nome: "novo gasto", valor: 0 }).select("id,nome,valor").single();
    if (e) return fail(e);
    patch((d) => ({ ...d, prev: [...d.prev, { ...(r as PrevItem), valor: num((r as PrevItem).valor) }] }));
  };
  const updatePrev = async (id: string, p: Partial<PrevItem>) => {
    const { error: e } = await sb.from("previsao_itens").update(p).eq("id", id);
    if (e) return fail(e);
    patch((d) => ({ ...d, prev: d.prev.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  };
  const deletePrev = async (id: string) => {
    const { error: e } = await sb.from("previsao_itens").delete().eq("id", id);
    if (e) return fail(e);
    patch((d) => ({ ...d, prev: d.prev.filter((x) => x.id !== id) }));
  };

  const saveConfig = async (p: Partial<Config>) => {
    const next = { ...(data?.config ?? DEFAULT_CONFIG), ...p };
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return;
    const { error: e } = await sb.from("configuracoes").upsert({ user_id: u.user.id, ...next });
    if (e) return fail(e);
    patch((d) => ({ ...d, config: next }));
  };

  const toggleCheckin = async (dia: string) => {
    if (!data) return;
    const on = data.checkins.has(dia);
    const { error: e } = on
      ? await sb.from("checkins").delete().eq("dia", dia)
      : await sb.from("checkins").insert({ dia });
    if (e) return fail(e);
    patch((d) => {
      const s = new Set(d.checkins);
      if (on) s.delete(dia);
      else s.add(dia);
      return { ...d, checkins: s };
    });
  };

  /** Importa o backup JSON do protótipo (artifact "meus saldos"). Adiciona aos dados existentes. */
  const importBackup = async (json: string) => {
    let o: {
      movs?: { tipo: Tipo; valor: number; desc?: string; data: string; rep?: string; vezes?: number; tags?: string[]; cartao?: string; excl?: string[] }[];
      tags?: { id: string; nome: string; cor: string }[];
      cartoes?: { id: string; nome: string; fech: number; venc: number }[];
      prev?: { itens?: { nome: string; valor: number }[]; div?: string };
      checkins?: Record<string, unknown>;
      inicial?: { valor: number; data: string } | null;
    };
    try {
      o = JSON.parse(json);
    } catch {
      return "esse texto não é um JSON válido";
    }
    if (!Array.isArray(o.movs)) return "não encontrei a lista de movimentações (movs)";
    const tagMap = new Map<string, string>();
    for (const t of o.tags ?? []) {
      const { data: r, error: e } = await sb.from("tags").insert({ nome: String(t.nome).slice(0, 60), cor: /^#[0-9a-f]{6}$/i.test(t.cor) ? t.cor : "#7a7a80" }).select("id").single();
      if (e) return "erro nas tags: " + e.message;
      tagMap.set(t.id, (r as { id: string }).id);
    }
    const cartMap = new Map<string, string>();
    for (const c of o.cartoes ?? []) {
      const { data: r, error: e } = await sb.from("cartoes").insert({ nome: String(c.nome).slice(0, 60), fechamento: c.fech, vencimento: c.venc }).select("id").single();
      if (e) return "erro nos cartões: " + e.message;
      cartMap.set(c.id, (r as { id: string }).id);
    }
    const reps = ["none", "mensal", "semanal", "diario", "parcelado"];
    const rows = o.movs.map((m) => ({
      tipo: m.tipo,
      valor: Number(m.valor),
      descricao: String(m.desc ?? "").slice(0, 200),
      data: m.data,
      repeticao: reps.includes(m.rep ?? "") ? m.rep : "none",
      vezes: Number(m.vezes) || 0,
      tag_ids: (m.tags ?? []).map((t) => tagMap.get(t)).filter(Boolean),
      cartao_id: m.tipo === "C" && m.cartao ? cartMap.get(m.cartao) ?? null : null,
      excecoes: m.excl ?? [],
    }));
    for (let i = 0; i < rows.length; i += 500) {
      const { error: e } = await sb.from("movimentacoes").insert(rows.slice(i, i + 500));
      if (e) return "erro nas movimentações: " + e.message;
    }
    const itens = o.prev?.itens ?? [];
    if (itens.length) {
      const { error: e } = await sb.from("previsao_itens").insert(itens.map((i) => ({ nome: String(i.nome).slice(0, 60), valor: Number(i.valor) || 0 })));
      if (e) return "erro na previsão: " + e.message;
    }
    const dias = Object.keys(o.checkins ?? {});
    if (dias.length) await sb.from("checkins").upsert(dias.map((dia) => ({ dia })), { ignoreDuplicates: true, onConflict: "user_id,dia" });
    if (o.inicial) await saveConfig({ saldo_inicial: Number(o.inicial.valor), data_saldo_inicial: o.inicial.data, previsao_divisor: o.prev?.div === "mes" ? "mes" : "30" });
    await reload();
    return "";
  };

  const resetAll = async () => {
    for (const t of ["movimentacoes", "previsao_itens", "tags", "cartoes"] as const) {
      const { error: e } = await sb.from(t).delete().not("id", "is", null);
      if (e) return fail(e);
    }
    await sb.from("checkins").delete().not("dia", "is", null);
    await saveConfig({ saldo_inicial: null, data_saldo_inicial: null });
    await reload();
    toast("conta zerada");
  };

  const value: StoreValue = {
    data, error, reload, saveMov, deleteMov, duplicateMov, excludeOccurrence, saveTag, deleteTag, saveCartao, deleteCartao,
    addPrev, updatePrev, deletePrev, saveConfig, toggleCheckin, importBackup, resetAll,
    toast, toastState, closeToast: () => setToast(null),
    movForm, openMovForm: (s) => setMovForm(s), closeMovForm: () => setMovForm(null),
    drawer, setDrawer,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
