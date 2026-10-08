import { useEffect, useMemo, useState } from "react";
import type { Bus, FormatoHora, Gasto, Lugar } from "../types";
import {
  llegadasOrdenadas,
  horaSalida,
  horaTexto,
  ordenarSalidas,
  salidasDe,
} from "../lib/horas";
import {
  buscarLugarPorNombre,
  buscarViajes,
  nombresDe,
  paradasIntermedias,
  rutaDe,
  urlGoogleMaps,
  type OpcionViaje,
} from "../lib/rutas";
import { precioTexto } from "../lib/busquedas";
import { Combo, Tarjeta } from "./ui";

export default function Viajar({
  buses,
  lugares,
  gastos,
  formatoHora,
}: {
  buses: Bus[];
  lugares: Lugar[];
  gastos: Gasto[];
  formatoHora: FormatoHora;
}) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [elegida, setElegida] = useState<OpcionViaje | null>(null);
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine !== false
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const nombresLugares = useMemo(
    () => lugares.map((l) => l.nombre).sort((a, b) => a.localeCompare(b)),
    [lugares]
  );

  const lugarDesde = useMemo(() => buscarLugarPorNombre(lugares, desde), [lugares, desde]);
  const lugarHasta = useMemo(() => buscarLugarPorNombre(lugares, hasta), [lugares, hasta]);

  const opciones = useMemo(() => {
    if (!lugarDesde || !lugarHasta || lugarDesde.id === lugarHasta.id) return [];
    return buscarViajes(buses, lugarDesde.id, lugarHasta.id);
  }, [buses, lugarDesde, lugarHasta]);

  useEffect(() => {
    setElegida(null);
  }, [desde, hasta]);

  const textoDesdeExiste = desde.trim() === "" || !!lugarDesde;
  const textoHastaExiste = hasta.trim() === "" || !!lugarHasta;

  const busActual = useMemo(
    () => (elegida ? buses.find((b) => b.id === elegida.bus.id) ?? elegida.bus : null),
    [elegida, buses]
  );

  const detalle = useMemo(() => {
    if (!elegida || !busActual) return null;
    const ruta = rutaDe(busActual, elegida.sentido);
    const salidas = ordenarSalidas(salidasDe(busActual, elegida.sentido), ruta);
    const inicio = elegida.segmento[0];
    const fin = elegida.segmento[elegida.segmento.length - 1];
    const gastosBus = gastos.filter((g) => g.busId === busActual.id);
    const tramo = gastosBus.filter((g) => g.desdeId === inicio && g.hastaId === fin);
    const otros = gastosBus.filter((g) => !tramo.includes(g));
    return { ruta, salidas, tramo, otros };
  }, [elegida, busActual, gastos]);

  const nombreLugar = (id: string) => lugares.find((l) => l.id === id)?.nombre || id;

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <h2 className="text-xl font-bold text-tinta">Viaje</h2>
      <p className="text-sm text-subtinta">
        Dinos de dónde vienes y a dónde quieres ir: te mostramos los buses que pasan por
        esos dos lugares y por dónde llegas.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Combo
          label="Vienes de"
          valor={desde}
          alCambiar={setDesde}
          opciones={nombresLugares}
          placeholder="Ej: Potrerillos Abajo"
        />
        <Combo
          label="Quieres ir a"
          valor={hasta}
          alCambiar={setHasta}
          opciones={nombresLugares}
          placeholder="Ej: David"
        />
      </div>

      {(!textoDesdeExiste || !textoHastaExiste) && (
        <Tarjeta>
          <p className="text-sm text-amber-600">
            Ese lugar no existe todavía. Créalo en la sección{" "}
            <b>Lugares</b> y vuelve a intentarlo.
          </p>
        </Tarjeta>
      )}

      {lugarDesde && lugarHasta && lugarDesde.id !== lugarHasta.id && opciones.length === 0 && (
        <Tarjeta>
          <p className="text-center text-sm text-subtinta">
            Ningún bus pasa por <b className="text-tinta">{lugarDesde.nombre}</b> y{" "}
            <b className="text-tinta">{lugarHasta.nombre}</b> con las rutas guardadas.
          </p>
        </Tarjeta>
      )}

      {lugarDesde &&
        lugarHasta &&
        opciones.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-tinta">
            {opciones.length} opción{opciones.length === 1 ? "" : "es"} de bus
          </p>
          {opciones.map((op, i) => {
            const activa =
              elegida &&
              elegida.bus.id === op.bus.id &&
              elegida.sentido === op.sentido;
            const segmento = nombresDe(lugares, op.segmento);
            return (
              <div key={`${op.bus.id}-${op.sentido}-${i}`}>
                <button
                  onClick={() => setElegida(activa ? null : op)}
                  className={`w-full rounded-3xl border-2 p-4 text-left transition active:scale-[0.99] ${
                    activa ? "border-acc bg-acc-suave" : "border-borde bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate font-bold text-tinta">
                      {op.bus.origen} - {op.bus.destino}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        op.sentido === "ida"
                          ? "bg-acc text-onacc"
                          : "bg-soft text-subtinta"
                      }`}
                    >
                      {op.sentido === "ida" ? "Ida" : "Vuelta"}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-xs text-subtinta">
                    <b className="text-acc">Pasa por: </b>
                    <span className="text-tinta">{segmento.join(" → ")}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-subtinta">
                    {paradasIntermedias(op.segmento) === 0
                      ? "Directo, sin paradas intermedias"
                      : `${paradasIntermedias(op.segmento)} lugar${
                          paradasIntermedias(op.segmento) === 1 ? "" : "es"
                        } entre medio`}
                    {activa ? " · tocado para cerrar" : " · toca para ver el mapa"}
                  </p>
                </button>

                {activa && (
                  <div className="mt-2 rounded-3xl border-2 border-acc bg-card p-3">
                    <p className="mb-2 text-xs font-semibold text-subtinta">
                      Recorrido de {lugarDesde.nombre} a {lugarHasta.nombre} en{" "}
                      {op.sentido === "ida"
                        ? `${op.bus.origen} → ${op.bus.destino}`
                        : `${op.bus.destino} → ${op.bus.origen}`}
                      :
                    </p>
                    <p className="mb-2 break-words rounded-2xl bg-soft px-3 py-2 text-xs font-semibold text-tinta">
                      {segmento.join(" ↔ ")}
                    </p>

                    {detalle && detalle.salidas.length > 0 && (
                      <div className="mb-2 rounded-2xl border-2 border-borde bg-soft p-3">
                        <p className="mb-1.5 text-xs font-bold text-tinta">
                          ⏰ Horarios de {op.sentido === "ida" ? "ida" : "vuelta"}
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {detalle.salidas.map((s) => (
                            <div key={s.id}>
                              <p className="text-xs font-extrabold text-acc">
                                Sale a las{" "}
                                {horaTexto(horaSalida(s, detalle.ruta), formatoHora)}
                              </p>
                              <p className="break-words text-[11px] text-subtinta">
                                {llegadasOrdenadas(s, op.segmento)
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
                          ))}
                        </div>
                      </div>
                    )}

                    {detalle && detalle.tramo.length > 0 && (
                      <div className="mb-2 rounded-2xl border-2 border-borde bg-soft p-3">
                        <p className="mb-1.5 text-xs font-bold text-tinta">
                          💵 Gastos registrados en este tramo
                        </p>
                        <div className="flex flex-col gap-1">
                          {detalle.tramo.map((g) => (
                            <div
                              key={g.id}
                              className="flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="text-subtinta">
                                {new Date(g.fecha).toLocaleDateString()}
                              </span>
                              <span className="font-bold text-acc">
                                {precioTexto(g.monto)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {detalle && detalle.otros.length > 0 && (
                      <div className="mb-2 rounded-2xl border-2 border-borde bg-soft p-3">
                        <p className="mb-1.5 text-xs font-bold text-tinta">
                          💵 Otros gastos de este bus (otras rutas)
                        </p>
                        <div className="flex flex-col gap-1">
                          {detalle.otros.map((g) => (
                            <div
                              key={g.id}
                              className="flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="min-w-0 truncate text-subtinta">
                                {nombreLugar(g.desdeId)} → {nombreLugar(g.hastaId)} ·{" "}
                                {new Date(g.fecha).toLocaleDateString()}
                              </span>
                              <span className="shrink-0 font-bold text-acc">
                                {precioTexto(g.monto)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {online ? (
                      <iframe
                        title="Mapa del recorrido"
                        src={urlGoogleMaps(segmento)}
                        loading="lazy"
                        className="h-64 w-full rounded-2xl border-2 border-borde"
                      />
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-borde bg-soft px-4 py-6 text-center text-sm text-subtinta">
                        Sin internet: el mapa de Google no está disponible ahora. El
                        recorrido de arriba sigue siendo válido.
                      </div>
                    )}
                    {online && (
                      <a
                        href={`https://www.google.com/maps/dir/${segmento
                          .map(encodeURIComponent)
                          .join("/")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-center text-xs font-bold text-acc"
                      >
                        Abrir en Google Maps ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!desde.trim() && !hasta.trim() && (
        <Tarjeta>
          <p className="text-center text-sm text-subtinta">
            Ejemplo: escribe <b className="text-tinta">Potrerillos Abajo</b> y{" "}
            <b className="text-tinta">Altamar</b> para ver qué buses pasan por ahí.
          </p>
        </Tarjeta>
      )}
    </div>
  );
}
