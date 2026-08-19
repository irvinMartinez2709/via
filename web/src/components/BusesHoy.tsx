import { useMemo, useState } from "react";
import type { Bus, SeleccionDia } from "../types";
import { uuid } from "../types";
import { horaTexto, horaAMinutos } from "../lib/busquedas";
import {
  paradasDeBus,
  buscarParada,
  calcularHoraPaso,
  programarRecordatorios,
  notificacionesDisponibles,
  pedirPermisoNotificaciones,
} from "../lib/notificaciones";
import { Tarjeta, Selector, Stepper } from "./ui";

function fechaHoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function BusesHoy({
  buses,
  dia,
  config,
  onAñadir,
  onEliminar,
}: {
  buses: Bus[];
  dia: SeleccionDia[];
  config: { recordatorioMin: number };
  onAñadir: (s: SeleccionDia) => void;
  onEliminar: (id: string) => void;
}) {
  const [selBusId, setSelBusId] = useState("");
  const [direccion, setDireccion] = useState<"ida" | "vuelta">("ida");
  const [subidaId, setSubidaId] = useState("");
  const [bajadaId, setBajadaId] = useState("");
  const [hora, setHora] = useState("");
  const [recordatorio, setRecordatorio] = useState(config.recordatorioMin);
  const [aviso, setAviso] = useState("");

  const busSeleccionado = buses.find((b) => b.id === selBusId);
  const paradas = useMemo(
    () => (busSeleccionado ? paradasDeBus(busSeleccionado) : []),
    [busSeleccionado]
  );

  const horasDisponibles = useMemo(() => {
    if (!busSeleccionado) return [];
    const lista = direccion === "ida" ? busSeleccionado.salidasIda : busSeleccionado.salidasVuelta;
    return [...lista].sort((a, b) => horaAMinutos(a) - horaAMinutos(b));
  }, [busSeleccionado, direccion]);

  function precioTramo(): number | null {
    if (!busSeleccionado || !subidaId || !bajadaId || subidaId === bajadaId) return null;
    const t = busSeleccionado.tarifas.find(
      (x) => x.desdeId === subidaId && x.hastaId === bajadaId
    );
    return t ? t.precio : null;
  }

  const totalDia = useMemo(() => {
    let total = 0;
    let conocido = true;
    for (const s of dia) {
      const b = buses.find((x) => x.id === s.busId);
      if (!b) continue;
      const t = b.tarifas.find(
        (x) => x.desdeId === s.paradaSubidaId && x.hastaId === s.paradaBajadaId
      );
      if (!t) {
        conocido = false;
        continue;
      }
      total += t.precio;
    }
    return { total, conocido };
  }, [dia, buses]);

  async function añadir() {
    if (!busSeleccionado || !subidaId || !bajadaId || !hora) {
      setAviso("Completa bus, subida, bajada y hora.");
      return;
    }
    if (subidaId === bajadaId) {
      setAviso("Subida y bajada no pueden ser la misma parada.");
      return;
    }
    const sel: SeleccionDia = {
      id: uuid(),
      busId: busSeleccionado.id,
      fecha: fechaHoy(),
      paradaSubidaId: subidaId,
      paradaBajadaId: bajadaId,
      direccion,
      hora,
      recordatorioMin: recordatorio <= 0 ? 10 : recordatorio,
    };
    if (notificacionesDisponibles()) {
      const ok = await pedirPermisoNotificaciones();
      if (ok) await programarRecordatorios(sel, busSeleccionado, buscarParada(busSeleccionado, subidaId)?.nombre || "");
    }
    onAñadir(sel);
    setAviso("");
    setSubidaId("");
    setBajadaId("");
    setHora("");
  }

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-tinta">Buses de hoy</h2>
        <div className="rounded-2xl bg-acc px-4 py-2 text-right text-onacc">
          <p className="text-[10px] font-semibold uppercase opacity-80">Total del día</p>
          <p className="text-lg font-extrabold leading-tight">
            {totalDia.conocido ? `$${totalDia.total.toFixed(2)}` : "—"}
          </p>
        </div>
      </div>

      {!notificacionesDisponibles() && (
        <p className="rounded-xl bg-soft px-3 py-2 text-xs text-subtinta">
          Los recordatorios se activan en la app de Android instalada.
        </p>
      )}

      {dia.length === 0 ? (
        <Tarjeta>
          <p className="text-center text-sm text-subtinta">
            Aún no has agregado buses para hoy. Elige abajo el bus, dónde subes y dónde
            bajas.
          </p>
        </Tarjeta>
      ) : (
        <div className="flex flex-col gap-3">
          {dia.map((s) => {
            const b = buses.find((x) => x.id === s.busId);
            if (!b) return null;
            const subida = buscarParada(b, s.paradaSubidaId);
            const bajada = buscarParada(b, s.paradaBajadaId);
            const t = b.tarifas.find(
              (x) => x.desdeId === s.paradaSubidaId && x.hastaId === s.paradaBajadaId
            );
            const horaPaso = calcularHoraPaso(b, s.direccion, s.hora, s.paradaSubidaId);
            return (
              <Tarjeta key={s.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-tinta">{b.nombre}</p>
                    <p className="text-sm text-subtinta">
                      {s.direccion === "ida" ? "→" : "←"}{" "}
                      {subida?.nombre || "?"} → {bajada?.nombre || "?"}
                    </p>
                    <p className="mt-1 text-sm text-tinta">
                      Salida {horaTexto(s.hora)} · pasa por {subida?.nombre} a las{" "}
                      <b>{horaTexto(horaPaso)}</b>
                    </p>
                    <p className="text-xs text-subtinta">
                      Recordatorio {s.recordatorioMin} min antes (+ 10 min obligatorio)
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-lg font-extrabold text-acc">
                      {t ? `$${t.precio.toFixed(2)}` : "—"}
                    </span>
                    <button
                      onClick={() => onEliminar(s.id)}
                      className="rounded-xl bg-red-500/10 px-3 py-1 text-xs font-bold text-red-500"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}

      <Tarjeta>
        <h3 className="mb-3 font-bold text-tinta">Agregar bus al día</h3>
        <div className="flex flex-col gap-3">
          <Selector
            label="Bus"
            valor={selBusId}
            alElegir={(id) => {
              setSelBusId(id);
              setSubidaId("");
              setBajadaId("");
              setHora("");
            }}
            opciones={buses.map((b) => ({ id: b.id, texto: b.nombre }))}
            placeholder="Selecciona un bus…"
          />

          {busSeleccionado && (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => { setDireccion("ida"); setHora(""); }}
                  className={`flex-1 rounded-2xl border-2 px-4 py-2.5 font-semibold ${
                    direccion === "ida"
                      ? "border-acc bg-acc text-onacc"
                      : "border-borde bg-card text-subtinta"
                  }`}
                >
                  {busSeleccionado.nombre.split(" - ")[0] || "Ida"} →
                </button>
                <button
                  onClick={() => { setDireccion("vuelta"); setHora(""); }}
                  className={`flex-1 rounded-2xl border-2 px-4 py-2.5 font-semibold ${
                    direccion === "vuelta"
                      ? "border-acc bg-acc text-onacc"
                      : "border-borde bg-card text-subtinta"
                  }`}
                >
                  ← {busSeleccionado.nombre.split(" - ")[1] || "Vuelta"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Selector
                  label="Subo en"
                  valor={subidaId}
                  alElegir={setSubidaId}
                  opciones={paradas.map((p) => ({ id: p.id, texto: p.nombre }))}
                  placeholder="¿Dónde subes?"
                />
                <Selector
                  label="Bajo en"
                  valor={bajadaId}
                  alElegir={setBajadaId}
                  opciones={paradas.map((p) => ({ id: p.id, texto: p.nombre }))}
                  placeholder="¿Dónde bajas?"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Selector
                  label="Hora de salida"
                  valor={hora}
                  alElegir={setHora}
                  opciones={horasDisponibles.map((h) => ({ id: h, texto: horaTexto(h) }))}
                  placeholder="Elige hora…"
                />
                <div>
                  <span className="mb-1 block text-sm font-semibold text-subtinta">
                    Recordar antes
                  </span>
                  <div className="rounded-2xl border-2 border-borde bg-soft px-3 py-1.5">
                    <Stepper
                      valor={recordatorio}
                      alCambiar={setRecordatorio}
                      min={0}
                      max={600}
                      paso={5}
                      sufijo="min"
                    />
                  </div>
                </div>
              </div>

              {subidaId && bajadaId && subidaId !== bajadaId && (
                <div className="rounded-2xl bg-soft px-4 py-3 text-sm">
                  <p className="text-subtinta">
                    {busSeleccionado.nombre} · {busSeleccionado.lugarPrincipal}
                  </p>
                  <p className="mt-1 font-semibold text-tinta">
                    {paradas.find((p) => p.id === subidaId)?.nombre} →{" "}
                    {paradas.find((p) => p.id === bajadaId)?.nombre}:{" "}
                    {precioTramo() !== null ? (
                      <b className="text-acc">${precioTramo()!.toFixed(2)}</b>
                    ) : (
                      <span className="text-subtinta">sin precio definido</span>
                    )}
                  </p>
                </div>
              )}

              {aviso && (
                <p className="rounded-xl bg-amber-500/15 px-3 py-2 text-xs text-amber-600">
                  {aviso}
                </p>
              )}

              <button
                onClick={añadir}
                className="rounded-2xl bg-acc py-3 font-bold text-onacc shadow active:scale-[0.98]"
              >
                Añadir a hoy
              </button>
            </>
          )}
        </div>
      </Tarjeta>
    </div>
  );
}