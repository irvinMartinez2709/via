import { useEffect, useMemo, useState } from "react";
import type { Bus, Gasto, Lugar } from "../types";
import { nombreBus } from "../types";
import { precioTexto } from "../lib/busquedas";
import {
  buscarLugarPorNombre,
  buscarViajes,
  type OpcionViaje,
} from "../lib/rutas";
import { Combo, TarifaInput, Tarjeta } from "./ui";
import ConfirmarDialog from "./ConfirmarDialog";

export default function Gastos({
  buses,
  lugares,
  gastos,
  onRegistrar,
  onEliminar,
}: {
  buses: Bus[];
  lugares: Lugar[];
  gastos: Gasto[];
  onRegistrar: (g: { busId: string; desdeId: string; hastaId: string; monto: number }) => void;
  onEliminar: (id: string) => void;
}) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [elegida, setElegida] = useState<OpcionViaje | null>(null);
  const [monto, setMonto] = useState<number | null>(null);
  const [aviso, setAviso] = useState("");
  const [borrar, setBorrar] = useState<Gasto | null>(null);

  const nombresLugares = useMemo(
    () => lugares.map((l) => l.nombre).sort((a, b) => a.localeCompare(b)),
    [lugares]
  );

  const lugarDesde = useMemo(() => buscarLugarPorNombre(lugares, desde), [lugares, desde]);
  const lugarHasta = useMemo(() => buscarLugarPorNombre(lugares, hasta), [lugares, hasta]);

  const rutaValida = !!lugarDesde && !!lugarHasta && lugarDesde.id !== lugarHasta.id;

  const opciones = useMemo(
    () => (rutaValida ? buscarViajes(buses, lugarDesde!.id, lugarHasta!.id) : []),
    [buses, rutaValida, lugarDesde, lugarHasta]
  );

  useEffect(() => {
    setElegida(null);
    setMonto(null);
    setAviso("");
  }, [desde, hasta]);

  const historial = useMemo(
    () => [...gastos].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [gastos]
  );

  function guardar() {
    if (!elegida) return;
    if (monto === null || isNaN(monto) || monto <= 0) {
      setAviso("Escribe cuánto dinero gastaste.");
      return;
    }
    onRegistrar({
      busId: elegida.bus.id,
      desdeId: elegida.segmento[0],
      hastaId: elegida.segmento[elegida.segmento.length - 1],
      monto,
    });
    setMonto(null);
    setAviso("Gasto guardado.");
  }

  const nombreLugar = (id: string) =>
    lugares.find((l) => l.id === id)?.nombre || id;

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <h2 className="text-xl font-bold text-tinta">Gastos</h2>
      <p className="text-sm text-subtinta">
        Elige de dónde a dónde viajaste y con qué bus: apunta cuánto dinero gastaste.
        Solo puedes registrar la ruta si existe algún bus que la cumpla.
      </p>

      <Tarjeta>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Combo
            label="Desde (lugar A)"
            valor={desde}
            alCambiar={setDesde}
            opciones={nombresLugares}
            placeholder="Ej: Dolega"
          />
          <Combo
            label="Hasta (lugar B)"
            valor={hasta}
            alCambiar={setHasta}
            opciones={nombresLugares}
            placeholder="Ej: David"
          />
        </div>

        {rutaValida && opciones.length === 0 && (
          <p className="mt-3 rounded-2xl bg-soft px-3 py-2.5 text-center text-sm text-subtinta">
            No existen buses que cumplan esa ruta con las rutas guardadas.
          </p>
        )}

        {opciones.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold text-subtinta">
              Elige el bus que usaste ({opciones.length} disponible
              {opciones.length === 1 ? "" : "s"})
            </p>
            <div className="flex flex-col gap-1.5">
              {opciones.map((op, i) => {
                const activa =
                  elegida &&
                  elegida.bus.id === op.bus.id &&
                  elegida.sentido === op.sentido;
                return (
                  <button
                    key={`${op.bus.id}-${op.sentido}-${i}`}
                    onClick={() => {
                      setElegida(activa ? null : op);
                      setMonto(null);
                      setAviso("");
                    }}
                    className={`flex items-center justify-between gap-2 rounded-2xl border-2 px-3 py-2.5 text-left active:scale-[0.99] ${
                      activa
                        ? "border-acc bg-acc text-onacc"
                        : "border-borde bg-soft text-tinta"
                    }`}
                  >
                    <span className="min-w-0 truncate text-sm font-bold">
                      {nombreBus(op.bus)}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        activa ? "bg-black/15" : "bg-card text-subtinta"
                      }`}
                    >
                      {op.sentido === "ida" ? "Ida" : "Vuelta"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {elegida && (
          <div className="mt-3 rounded-2xl border-2 border-acc bg-acc-suave p-3">
            <p className="mb-2 break-words text-xs font-semibold text-acc">
              {lugarDesde!.nombre} → {lugarHasta!.nombre} en {nombreBus(elegida.bus)} (
              {elegida.sentido})
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-acc">$</span>
              <div className="flex-1">
                <TarifaInput
                  valor={monto}
                  alCambiar={(p) => setMonto(p)}
                  placeholder="¿Cuánto gastaste?"
                />
              </div>
            </div>
            <button
              onClick={guardar}
              className="mt-3 w-full rounded-2xl bg-acc px-4 py-3 font-bold text-onacc active:scale-[0.98]"
            >
              Guardar gasto
            </button>
            {aviso && (
              <p className="mt-2 text-center text-xs font-semibold text-acc">{aviso}</p>
            )}
          </div>
        )}
      </Tarjeta>

      <div>
        <h3 className="mb-2 font-bold text-tinta">
          Gastos guardados ({historial.length})
        </h3>
        {historial.length === 0 ? (
          <Tarjeta>
            <p className="text-center text-sm text-subtinta">
              Todavía no has registrado gastos.
            </p>
          </Tarjeta>
        ) : (
          <div className="flex flex-col gap-2">
            {historial.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 rounded-3xl border-2 border-borde bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-tinta">
                    {nombreLugar(g.desdeId)} → {nombreLugar(g.hastaId)}
                  </p>
                  <p className="truncate text-xs text-subtinta">
                    {buses.find((b) => b.id === g.busId)
                      ? nombreBus(buses.find((b) => b.id === g.busId)!)
                      : "Bus eliminado"}
                    {" · "}
                    {new Date(g.fecha).toLocaleDateString()}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-extrabold text-acc">
                  {precioTexto(g.monto)}
                </p>
                <button
                  onClick={() => setBorrar(g)}
                  aria-label="Eliminar gasto"
                  className="h-9 w-9 shrink-0 rounded-xl border-2 border-borde bg-soft text-red-500 active:scale-95"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {borrar && (
        <ConfirmarDialog
          titulo="Eliminar gasto"
          mensaje={
            <>
              Se eliminará el gasto de {nombreLugar(borrar.desdeId)} a{" "}
              {nombreLugar(borrar.hastaId)} por {precioTexto(borrar.monto)}.
            </>
          }
          confirmar={() => {
            onEliminar(borrar.id);
            setBorrar(null);
          }}
          cancelar={() => setBorrar(null)}
          peligro
          textoConfirmar="Eliminar"
        />
      )}
    </div>
  );
}
