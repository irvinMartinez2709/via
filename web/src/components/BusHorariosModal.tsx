import { useState } from "react";
import type { Bus, FormatoHora, Llegada, Salida, Sentido } from "../types";
import { nombreBus, uuid } from "../types";
import {
  alinearLlegadas,
  horaAhora,
  horaSalida,
  horaTexto,
  llegadasOrdenadas,
  ordenarSalidas,
} from "../lib/horas";
import { nombresDe } from "../lib/rutas";

export default function BusHorariosModal({
  bus,
  lugares,
  formatoHora,
  onGuardar,
  onCerrar,
}: {
  bus: Bus;
  lugares: { id: string; nombre: string }[];
  formatoHora: FormatoHora;
  onGuardar: (horarios: { ida: Salida[]; vuelta: Salida[] }) => void;
  onCerrar: () => void;
}) {
  const [sentido, setSentido] = useState<Sentido>("ida");
  const [ida, setIda] = useState<Salida[]>(bus.horarios.ida);
  const [vuelta, setVuelta] = useState<Salida[]>(bus.horarios.vuelta);
  const [editando, setEditando] = useState<{
    salida: Salida;
    esNueva: boolean;
    llegadas: Llegada[];
  } | null>(null);

  const ruta = sentido === "ida" ? bus.ida : bus.vuelta;
  const salidas = sentido === "ida" ? ida : vuelta;
  const setSalidas = sentido === "ida" ? setIda : setVuelta;

  function nuevaSalida() {
    const s: Salida = {
      id: uuid(),
      llegadas: ruta.map((l) => ({ lugarId: l, hora: horaAhora() })),
    };
    setEditando({ salida: s, esNueva: true, llegadas: s.llegadas.map((x) => ({ ...x })) });
  }

  function guardarEdicion() {
    if (!editando) return;
    const valida = editando.llegadas.every((l) => l.hora === "" || /^\d{1,2}:\d{2}$/.test(l.hora));
    if (!valida) return;
    const limpia = alinearLlegadas(editando.llegadas, ruta);
    if (editando.esNueva) {
      setSalidas(ordenarSalidas([...salidas, { id: editando.salida.id, llegadas: limpia }], ruta));
    } else {
      setSalidas(
        ordenarSalidas(
          salidas.map((s) =>
            s.id === editando.salida.id ? { ...s, llegadas: limpia } : s
          ),
          ruta
        )
      );
    }
    setEditando(null);
  }

  function eliminarSalida(id: string) {
    setSalidas(salidas.filter((s) => s.id !== id));
  }

  const salidasOrdenadas = ordenarSalidas(salidas, ruta);

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
            <h3 className="truncate font-bold text-tinta">
              Horarios de {nombreBus(bus)}
            </h3>
            <p className="text-xs text-subtinta">
              Hora en la que el bus pasa por cada lugar. No son exactas, ajústalas a tu
              gusto.
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
            onClick={() => {
              setSentido("ida");
              setEditando(null);
            }}
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
            onClick={() => {
              setSentido("vuelta");
              setEditando(null);
            }}
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
          {ruta.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-borde bg-soft px-4 py-6 text-center text-sm text-subtinta">
              Primero añade la ruta de {sentido === "ida" ? "ida" : "vuelta"} en{" "}
              <b className="text-tinta">Añadir rutas</b>: los horarios siguen el orden de
              los lugares de la ruta.
            </div>
          ) : editando ? (
            <div>
              <p className="mb-2 text-xs font-semibold text-subtinta">
                {editando.esNueva ? "Nuevo horario" : "Editar horario"} de{" "}
                {sentido === "ida" ? "ida" : "vuelta"} — hora de paso por cada lugar:
              </p>
              <div className="flex flex-col gap-1.5">
                {editando.llegadas.map((l, i) => (
                  <div
                    key={l.lugarId}
                    className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2 ${
                      i === 0
                        ? "border-acc bg-acc-suave"
                        : "border-borde bg-soft"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-tinta">
                        {nombresDe(lugares, [l.lugarId])[0]}
                      </span>
                      {i === 0 && (
                        <span className="text-[10px] font-bold text-acc">
                          {sentido === "ida" ? "sale de " + bus.origen : "sale de " + bus.destino}
                        </span>
                      )}
                    </span>
                    <input
                      type="time"
                      value={l.hora}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditando({
                          ...editando,
                          llegadas: editando.llegadas.map((x, j) =>
                            j === i ? { ...x, hora: v } : x
                          ),
                        });
                      }}
                      className="w-28 shrink-0 rounded-xl border-2 border-borde bg-card px-2 py-1.5 text-center text-sm font-bold text-tinta outline-none focus:border-acc"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setEditando(null)}
                  className="flex-1 rounded-2xl border-2 border-borde bg-soft px-4 py-3 font-semibold text-subtinta active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarEdicion}
                  className="flex-1 rounded-2xl bg-acc px-4 py-3 font-bold text-onacc active:scale-95"
                >
                  Guardar horario
                </button>
              </div>
            </div>
          ) : (
            <div>
              {salidasOrdenadas.length === 0 && (
                <div className="mb-3 rounded-2xl border-2 border-dashed border-borde bg-soft px-4 py-4 text-center text-sm text-subtinta">
                  Sin horarios de {sentido === "ida" ? "ida" : "vuelta"} todavía.
                </div>
              )}
              <div className="flex flex-col gap-2">
                {salidasOrdenadas.map((s) => {
                  const llegadas = llegadasOrdenadas(s, ruta);
                  const salidaHora = horaSalida(s, ruta);
                  return (
                    <div
                      key={s.id}
                      className="rounded-2xl border-2 border-borde bg-soft px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-lg font-extrabold text-acc">
                          {horaTexto(salidaHora, formatoHora)}
                          <span className="ml-2 text-[10px] font-bold text-subtinta">
                            salida
                          </span>
                        </p>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setEditando({
                                salida: s,
                                esNueva: false,
                                llegadas: llegadasOrdenadas(s, ruta),
                              });
                            }}
                            aria-label="Editar horario"
                            className="h-9 w-9 rounded-xl border-2 border-borde bg-card text-subtinta active:scale-95"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => eliminarSalida(s.id)}
                            aria-label="Eliminar horario"
                            className="h-9 w-9 rounded-xl border-2 border-borde bg-card text-red-500 active:scale-95"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 break-words text-[11px] text-subtinta">
                        {llegadas
                          .map(
                            (l) =>
                              `${nombresDe(lugares, [l.lugarId])[0]} ${horaTexto(
                                l.hora,
                                formatoHora
                              )}`
                          )
                          .join(" · ")}
                      </p>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={nuevaSalida}
                className="mt-3 w-full rounded-2xl border-2 border-dashed border-borde bg-card px-4 py-3 text-sm font-semibold text-subtinta active:scale-[0.98]"
              >
                + Añadir horario de {sentido === "ida" ? "ida" : "vuelta"}
              </button>
            </div>
          )}
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
            Guardar horarios
          </button>
        </div>
      </div>
    </div>
  );
}
