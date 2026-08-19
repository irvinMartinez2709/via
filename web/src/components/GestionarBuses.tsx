import { useMemo, useState } from "react";
import type { Bus } from "../types";
import { coincidenBuses } from "../lib/busquedaApp";
import { Chip, Tarjeta } from "./ui";
import BusCard from "./BusCard";
import BusFormulario from "./BusFormulario";

export default function GestionarBuses({
  buses,
  lugares,
  onGuardar,
  onEliminar,
  onToggleFavorito,
}: {
  buses: Bus[];
  lugares: string[];
  onGuardar: (b: Bus) => void;
  onEliminar: (id: string) => void;
  onToggleFavorito: (id: string) => void;
}) {
  const [editando, setEditando] = useState<Bus | "nuevo" | null>(null);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "favoritos" | "sinTarifa">("todos");

  const filtrados = useMemo(() => {
    let lista = buses;
    if (filtro === "favoritos") lista = lista.filter((b) => b.favorito);
    if (filtro === "sinTarifa") lista = lista.filter((b) => b.tarifas.length === 0);
    if (q.trim()) lista = coincidenBuses(lista, q);
    return lista;
  }, [buses, q, filtro]);

  if (editando) {
    return (
      <div className="animate-fade-in">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => setEditando(null)}
            className="rounded-xl border-2 border-borde bg-card px-3 py-2 font-bold text-tinta active:scale-95"
          >
            ‹
          </button>
          <h2 className="text-xl font-bold text-tinta">
            {editando === "nuevo" ? "Nuevo bus" : "Editar bus"}
          </h2>
        </div>
        <BusFormulario
          busInicial={editando === "nuevo" ? null : editando}
          lugares={lugares}
          onGuardar={(b) => {
            onGuardar(b);
            setEditando(null);
          }}
          onCancelar={() => setEditando(null)}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-tinta">Mis buses</h2>
        <button
          onClick={() => setEditando("nuevo")}
          className="rounded-2xl bg-acc px-4 py-2.5 font-bold text-onacc shadow active:scale-95"
        >
          + Nuevo
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar bus o parada…"
        className="mb-3 w-full rounded-2xl border-2 border-borde bg-card px-4 py-3 text-tinta outline-none placeholder:text-subtinta/60 focus:border-acc"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Chip activo={filtro === "todos"} onClick={() => setFiltro("todos")}>
          Todos ({buses.length})
        </Chip>
        <Chip activo={filtro === "favoritos"} onClick={() => setFiltro("favoritos")}>
          Favoritos
        </Chip>
        <Chip activo={filtro === "sinTarifa"} onClick={() => setFiltro("sinTarifa")}>
          Sin tarifas
        </Chip>
      </div>

      {filtrados.length === 0 ? (
        <Tarjeta>
          <p className="text-center text-sm text-subtinta">
            {buses.length === 0
              ? "Aún no tienes buses. Pulsa + Nuevo para añadir el primero."
              : "No hay resultados con ese filtro."}
          </p>
        </Tarjeta>
      ) : (
        <div className="flex flex-col gap-3">
          {filtrados.map((b) => (
            <BusCard
              key={b.id}
              bus={b}
              onEditar={() => setEditando(b)}
              onEliminar={() => onEliminar(b.id)}
              onFavorito={() => onToggleFavorito(b.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
