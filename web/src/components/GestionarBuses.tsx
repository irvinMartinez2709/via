import { useMemo, useState } from "react";
import type { Bus, FormatoHora, Lugar, Salida } from "../types";
import { crearBus, nombreBus } from "../types";
import { coincideFuzzy } from "../lib/busquedas";
import { horaSalida, horaTexto, ordenarSalidas } from "../lib/horas";
import { cadenaTexto, nombresDe } from "../lib/rutas";
import { Chip, Combo, Tarjeta } from "./ui";
import BusRutasModal from "./BusRutasModal";
import BusHorariosModal from "./BusHorariosModal";
import ConfirmarDialog from "./ConfirmarDialog";

export default function GestionarBuses({
  buses,
  lugares,
  formatoHora,
  onGuardarBus,
  onEliminarBus,
  onToggleFavorito,
  onAsegurarLugar,
  onGuardarHorarios,
}: {
  buses: Bus[];
  lugares: Lugar[];
  formatoHora: FormatoHora;
  onGuardarBus: (b: Bus) => void;
  onEliminarBus: (id: string) => void;
  onToggleFavorito: (id: string) => void;
  onAsegurarLugar: (nombre: string) => Lugar | null;
  onGuardarHorarios: (busId: string, sentido: "ida" | "vuelta", salidas: Salida[]) => void;
}) {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [aviso, setAviso] = useState("");
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "favoritos" | "sinRutas">("todos");
  const [rutasDe, setRutasDe] = useState<Bus | null>(null);
  const [horariosDe, setHorariosDe] = useState<Bus | null>(null);
  const [borrar, setBorrar] = useState<Bus | null>(null);

  const nombresLugares = useMemo(
    () => lugares.map((l) => l.nombre).sort((a, b) => a.localeCompare(b)),
    [lugares]
  );

  const filtrados = useMemo(() => {
    let lista = buses;
    if (filtro === "favoritos") lista = lista.filter((b) => b.favorito);
    if (filtro === "sinRutas")
      lista = lista.filter((b) => b.ida.length === 0 && b.vuelta.length === 0);
    if (q.trim()) {
      const texto = q.trim();
      lista = lista.filter(
        (b) =>
          coincideFuzzy(nombreBus(b), texto) ||
          b.ida.some((id) =>
            coincideFuzzy(nombresDe(lugares, [id])[0], texto)
          ) ||
          b.vuelta.some((id) => coincideFuzzy(nombresDe(lugares, [id])[0], texto))
      );
    }
    return lista;
  }, [buses, filtro, q, lugares]);

  function añadirBus() {
    const o = origen.trim();
    const d = destino.trim();
    if (!o || !d) {
      setAviso("Escribe el lugar de la izquierda y el de la derecha.");
      return;
    }
    if (o.toLowerCase() === d.toLowerCase()) {
      setAviso("El origen y el destino deben ser lugares diferentes.");
      return;
    }
    onAsegurarLugar(o);
    onAsegurarLugar(d);
    const nuevo = crearBus(o, d);
    onGuardarBus(nuevo);
    setOrigen("");
    setDestino("");
    setAviso("");
    setRutasDe(nuevo);
  }

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <h2 className="text-xl font-bold text-tinta">Mis buses</h2>

      <Tarjeta>
        <h3 className="mb-1 font-bold text-tinta">Añadir bus</h3>
        <p className="mb-3 text-xs text-subtinta">
          El lugar de la <b>izquierda</b> es el origen y el de la <b>derecha</b> el
          destino. Ejemplo: <b>Potrerillos Abajo</b> – <b>David</b>.
        </p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div className="min-w-0">
            <Combo
              label="Origen"
              valor={origen}
              alCambiar={setOrigen}
              opciones={nombresLugares}
              placeholder="Izquierda…"
            />
          </div>
          <span className="pb-3 text-lg font-extrabold text-subtinta">–</span>
          <div className="min-w-0">
            <Combo
              label="Destino"
              valor={destino}
              alCambiar={setDestino}
              opciones={nombresLugares}
              placeholder="Derecha…"
            />
          </div>
        </div>
        {aviso && <p className="mt-2 text-xs font-semibold text-amber-600">{aviso}</p>}
        <button
          onClick={añadirBus}
          className="mt-3 w-full rounded-2xl bg-acc px-4 py-3 font-bold text-onacc active:scale-[0.98]"
        >
          + Añadir bus
        </button>
        {(origen.trim() || destino.trim()) && (
          <p className="mt-2 text-center text-xs font-semibold text-acc">
            {origen.trim() || "…"} – {destino.trim() || "…"}
          </p>
        )}
      </Tarjeta>

      {buses.length > 3 && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar bus o lugar…"
          className="w-full rounded-2xl border-2 border-borde bg-card px-4 py-3 text-tinta outline-none placeholder:text-subtinta/60 focus:border-acc"
        />
      )}

      {buses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Chip activo={filtro === "todos"} onClick={() => setFiltro("todos")}>
            Todos ({buses.length})
          </Chip>
          <Chip activo={filtro === "favoritos"} onClick={() => setFiltro("favoritos")}>
            Favoritos
          </Chip>
          <Chip activo={filtro === "sinRutas"} onClick={() => setFiltro("sinRutas")}>
            Sin rutas
          </Chip>
        </div>
      )}

      {buses.length === 0 ? (
        <Tarjeta>
          <p className="text-center text-sm text-subtinta">
            Aún no tienes buses. Crea el primero arriba y luego dale a{" "}
            <b className="text-tinta">Añadir rutas</b>.
          </p>
        </Tarjeta>
      ) : filtrados.length === 0 ? (
        <Tarjeta>
          <p className="text-center text-sm text-subtinta">
            Ningún bus coincide con ese filtro.
          </p>
        </Tarjeta>
      ) : (
        <div className="flex flex-col gap-3">
          {filtrados.map((b) => (
            <Tarjeta key={b.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold text-tinta">{nombreBus(b)}</p>
                  <p className="text-xs text-subtinta">
                    {b.ida.length} lugares de ida · {b.vuelta.length} de vuelta
                  </p>
                </div>
                <button
                  onClick={() => onToggleFavorito(b.id)}
                  aria-label="Favorito"
                  className={`h-10 w-10 shrink-0 rounded-xl border-2 border-borde text-lg active:scale-95 ${
                    b.favorito ? "bg-amber-400/20" : "bg-soft"
                  }`}
                >
                  {b.favorito ? "★" : "☆"}
                </button>
              </div>

              <div className="mt-2 flex flex-col gap-1.5">
                <p className="break-words rounded-2xl bg-soft px-3 py-2 text-xs">
                  <span className="font-extrabold text-acc">Ida: </span>
                  {b.ida.length ? (
                    <span className="text-tinta">{cadenaTexto(nombresDe(lugares, b.ida))}</span>
                  ) : (
                    <span className="text-subtinta">sin ruta — pulsa Añadir rutas</span>
                  )}
                </p>
                <p className="break-words rounded-2xl bg-soft px-3 py-2 text-xs">
                  <span className="font-extrabold text-acc">Vuelta: </span>
                  {b.vuelta.length ? (
                    <span className="text-tinta">
                      {cadenaTexto(nombresDe(lugares, b.vuelta))}
                    </span>
                  ) : (
                    <span className="text-subtinta">sin ruta — las calles suelen ser otras</span>
                  )}
                </p>
              </div>

              {(b.horarios.ida.length > 0 || b.horarios.vuelta.length > 0) && (
                <div className="mt-1.5 flex flex-col gap-0.5">
                  {b.horarios.ida.length > 0 && (
                    <p className="text-[11px] text-subtinta">
                      ⏰ Ida:{" "}
                      <span className="font-semibold text-tinta">
                        {ordenarSalidas(b.horarios.ida, b.ida)
                          .map((s) => horaTexto(horaSalida(s, b.ida), formatoHora))
                          .join(" · ")}
                      </span>
                    </p>
                  )}
                  {b.horarios.vuelta.length > 0 && (
                    <p className="text-[11px] text-subtinta">
                      ⏰ Vuelta:{" "}
                      <span className="font-semibold text-tinta">
                        {ordenarSalidas(b.horarios.vuelta, b.vuelta)
                          .map((s) => horaTexto(horaSalida(s, b.vuelta), formatoHora))
                          .join(" · ")}
                      </span>
                    </p>
                  )}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setRutasDe(b)}
                  className="flex-1 rounded-2xl bg-acc px-4 py-2.5 text-sm font-bold text-onacc active:scale-95"
                >
                  Añadir rutas
                </button>
                <button
                  onClick={() => setHorariosDe(b)}
                  className="rounded-2xl border-2 border-borde bg-soft px-3 py-2.5 text-sm font-bold text-tinta active:scale-95"
                >
                  ⏰ Horarios
                </button>
                <button
                  onClick={() => setBorrar(b)}
                  aria-label="Eliminar bus"
                  className="h-11 w-11 shrink-0 rounded-2xl border-2 border-borde bg-soft text-red-500 active:scale-95"
                >
                  🗑
                </button>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}

      {rutasDe && (
        <BusRutasModal
          bus={rutasDe}
          lugares={lugares}
          onGuardar={(rutas) => {
            onGuardarBus({ ...rutasDe, ...rutas });
            setRutasDe(null);
          }}
          onCerrar={() => setRutasDe(null)}
        />
      )}

      {horariosDe && (
        <BusHorariosModal
          bus={horariosDe}
          lugares={lugares}
          formatoHora={formatoHora}
          onGuardar={(horarios) => {
            onGuardarHorarios(horariosDe.id, "ida", horarios.ida);
            onGuardarHorarios(horariosDe.id, "vuelta", horarios.vuelta);
            setHorariosDe(null);
          }}
          onCerrar={() => setHorariosDe(null)}
        />
      )}

      {borrar && (
        <ConfirmarDialog
          titulo={`Eliminar ${nombreBus(borrar)}`}
          mensaje={
            <>
              Se quitará el bus y los gastos registrados con él. Los lugares creados se
              mantienen. Esta acción no se puede deshacer.
            </>
          }
          confirmar={() => {
            onEliminarBus(borrar.id);
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
