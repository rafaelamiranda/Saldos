"use client";
import { useStore } from "@/lib/store";

export function Toast() {
  const { toastState, closeToast } = useStore();
  if (!toastState) return null;
  return (
    <div className="toast show" role="status">
      <span>{toastState.msg}</span>
      {toastState.undo && <button onClick={() => { const u = toastState.undo; closeToast(); u?.(); }}>desfazer</button>}
    </div>
  );
}
