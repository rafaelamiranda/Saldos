"use client";
import { useEffect, useRef, type ReactNode } from "react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    ref.current?.querySelector<HTMLElement>("input,select,textarea")?.focus();
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <>
      <div className="ov show" onClick={onClose} />
      <div className="modal show" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="mh2">
          <h3>{title}</h3>
          <button className="ib" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        {children}
      </div>
    </>
  );
}

export function Confirm({ title, text, okLabel, onOk, onClose }: { title: string; text: string; okLabel: string; onOk: () => void; onClose: () => void }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p>{text}</p>
      <button className="btn red" onClick={() => { onClose(); onOk(); }}>{okLabel}</button>
      <button className="btn ghost" onClick={onClose}>cancelar</button>
    </Modal>
  );
}
