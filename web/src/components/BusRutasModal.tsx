import { useMemo, useState } from "react";
import type { Bus, Lugar, Sentido } from "../types";
import { nombreBus } from "../types";
import { coincideFuzzy } from "../lib/busquedas";
import { cadenaTexto, nombresDe } from "../lib/rutas";

export default function BusRutasModal({
  bus,
  lugares,
  onGuardar,
  onCerrar,
}: {
  bus: Bus;
  lugares: Lugar[];
  onGuardar: (rutas: { ida: string[]; vuelta: string[] }) => void;
  onCerrar: () => void;
}) {
  const [sentido, setSentido] = useState<Sentido>("ida");
  const [ida, setIda] = useState<string[]>(bus.ida);
  const [vuelta, setVuelta] = useState<string[]>(bus.vuelta);
  const [q, setQ] = useState("");

  const actual = sentido === "ida" ? ida : vuelta;
  const setActual = sentido === "ida" ? setIda : setVuelta;

  const disponibles = useMemo(() => {
    const lista = [...lugares].sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (!q.trim()) return lista;
    return lista.filter((l) => coincideFuzzy(l.nombre, q));
  }, [lugares, q]);

  function añadir(id: string) {
    if (actual.includes(id)) return;
    setActual([...actual, id]);
  }

  function quitar(id: string) {
    setActual(actual.filter((x) => x !== id));
  }

  function mover(id: string, delta: number) {
    const i = actual.indexOf(id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= actual.length) return;
    const copia = [...actual];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    setActual(copia);
  }

  const nombreDe = (ids: string[]) => nombresDe(lugares, ids);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={onCerrar}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-md animate-pop flex-col rounded-t-3xl border-2 border-borde bg-card p-4 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-tinta">Rutas de {nombreBus(bus)}</h3>
            <p className="text-xs text-subtinta">
              Elige los lugares en orden: así Via sabe por dónde pasa el bus.
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="shrink-0 rounded-xl bg-soft px-3 py-1.5 font-bold text-subtinta"
          >
            ✕
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          <button
            onClick={() => setSentido("ida")}
            className={`flex-1 rounded-2xl border-2 px-3 py-2.5 text-sm font-bold active:scale-95 ${
              sentido === "ida"
                ? "border-acc bg-acc text-onacc"
                : "border-borde bg-soft text-subtinta"
            }`}
          >
            Ida ({ida.length})
            <span className="block text-[10px] font-medium opacity-80">
              {bus.origen} → {bus.destino}
            </span>
          </button>
          <button
            onClick={() => setSentido("vuelta")}
            className={`flex-1 rounded-2xl border-2 px-3 py-2.5 text-sm font-bold active:scale-95 ${
              sentido === "vuelta"
                ? "border-acc bg-acc text-onacc"
                : "border-borde bg-soft text-subtinta"
            }`}
          >
            Vuelta ({vuelta.length})
            <span className="block text-[10px] font-medium opacity-80">
              {bus.destino} → {bus.origen}
            </span>
          </button>
        </div>

        <div className="smooth-scroll flex-1 overflow-y-auto">
          <p className="mb-1 text-xs font-semibold text-subtinta">
            Orden de {sentido === "ida" ? "ida" : "vuelta"} (jerarquía de nodos)
          </p>

          {actual.length === 0 ? (
            <div className="mb-3 rounded-2xl border-2 border-dashed border-borde bg-soft px-4 py-4 text-center text-sm text-subtinta">
              Sin lugares todavía. Toca un lugar abajo para añadirlo al recorrido.
            </div>
          ) : (
            <>
              <div className="mb-2 flex flex-col gap-1.5">
                {actual.map((id, i) => (
                  <div
                    key={id}
                    className="flex items-center gap-2 rounded-2xl border-2 border-borde bg-soft px-3 py-2"
                  >
                    <span className="w-6 shrink-0 text-center text-xs font-extrabold text-acc">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-tinta">
                      {nombresDe(lugares, [id])[0]}
                    </span>
                    <button
                      onClick={() => mover(id, -1)}
                      disabled={i === 0}
                      aria-label="Subir"
                      className="h-8 w-8 rounded-lg border-2 border-borde bg-card text-sm font-bold text-subtinta disabled:opacity-30 active:scale-95"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => mover(id, 1)}
                      disabled={i === actual.length - 1}
                      aria-label="Bajar"
                      className="h-8 w-8 rounded-lg border-2 border-borde bg-card text-sm font-bold text-subtinta disabled:opacity-30 active:scale-95"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => quitar(id)}
                      aria-label="Quitar"
                      className="h-8 w-8 rounded-lg border-2 border-borde bg-card text-sm font-bold text-red-500 active:scale-95"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <p className="mb-3 break-words rounded-2xl bg-acc-suave px-3 py-2 text-xs font-semibold text-acc">
                {cadenaTexto(nombreDe(actual))}
              </p>
              <div className="mb-3 flex gap-2">
                <button
                  onClick={() => setActual([...actual].reverse())}
                  className="flex-1 rounded-2xl border-2 border-borde bg-soft px-3 py-2 text-xs font-bold text-subtinta active:scale-95"
                >
                  ⇅ Invertir orden
                </button>
                <button
                  onClick={() => setActual([])}
                  className="flex-1 rounded-2xl border-2 border-borde bg-soft px-3 py-2 text-xs font-bold text-red-500 active:scale-95"
                >
                  Vaciar {sentido === "ida" ? "ida" : "vuelta"}
                </button>
              </div>
            </>
          )}

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca un lugar escribiendo…"
            className="mb-2 w-full rounded-2xl border-2 border-borde bg-card px-4 py-2.5 text-sm text-tinta outline-none placeholder:text-subtinta/60 focus:border-acc"
          />

          <p className="mb-1 text-xs font-semibold text-subtinta">
            Lugares disponibles ({disponibles.length}) — toca para añadir
          </p>
          <div className="smooth-scroll max-h-56 overflow-y-auto rounded-2xl border-2 border-borde bg-soft p-1.5">
            {disponibles.length === 0 && (
              <p className="px-3 py-3 text-sm text-subtinta">
                No hay lugares así. Crea el lugar en la sección Lugares.
              </p>
            )}
            {disponibles.map((l) => {
              const dentro = actual.includes(l.id);
              const indice = actual.indexOf(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => (dentro ? quitar(l.id) : añadir(l.id))}
                  className={`mb-1 flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm active:scale-[0.99] ${
                    dentro ? "bg-acc text-onacc" : "bg-card text-tinta"
                  }`}
                >
                  <span className="min-w-0 truncate font-semibold">{l.nombre}</span>
                  <span className={`shrink-0 text-xs font-bold ${dentro ? "opacity-80" : "text-subtinta"}`}>
                    {dentro ? `#${indice + 1} ✓` : "+ Añadir"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={onCerrar}
            className="flex-1 rounded-2xl border-2 border-borde bg-soft px-4 py-3 font-semibold text-subtinta active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={() => onGuardar({ ida, vuelta })}
            className="flex-1 rounded-2xl bg-acc px-4 py-3 font-bold text-onacc active:scale-95"
          >
            Guardar rutas
          </button>
        </div>
      </div>
    </div>
  );
}
