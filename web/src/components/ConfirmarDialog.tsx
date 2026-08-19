import type { ReactNode } from "react";

export default function ConfirmarDialog({
  titulo,
  mensaje,
  confirmar,
  cancelar,
  peligro,
  textoConfirmar,
}: {
  titulo: string;
  mensaje: ReactNode;
  confirmar: () => void;
  cancelar: () => void;
  peligro?: boolean;
  textoConfirmar?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={cancelar}
    >
      <div
        className="w-full max-w-md animate-pop rounded-3xl border-2 border-borde bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-tinta">{titulo}</h3>
        <div className="mt-2 text-sm text-subtinta">{mensaje}</div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={cancelar}
            className="flex-1 rounded-2xl border-2 border-borde bg-soft px-4 py-3 font-semibold text-tinta active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            className={`flex-1 rounded-2xl px-4 py-3 font-semibold text-onacc active:scale-95 ${
              peligro ? "bg-red-500" : "bg-acc"
            }`}
          >
            {textoConfirmar || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
