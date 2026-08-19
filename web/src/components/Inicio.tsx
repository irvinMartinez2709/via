import { useMemo, useState } from "react";
import type { Bus, SeleccionDia } from "../types";
import { horaAMinutos, horaActualMin, horaTexto } from "../lib/busquedas";
import { paradasDeBus, buscarParada, calcularHoraPaso } from "../lib/notificaciones";
import { Tarjeta } from "./ui";
import { coincidenBuses } from "../lib/busquedaApp";

export default function Inicio({
  buses,
  dia,
  onNavegar,
}: {
  buses: Bus[];
  dia: SeleccionDia[];
  onNavegar: (seccion: string) => void;
}) {
  const [q, setQ] = useState("");
  const ahora = horaActualMin();

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

  const estadisticas = useMemo(() => {
    const totalParadas = buses.reduce((acc, b) => acc + b.paradas.length, 0);
    const conTarifas = buses.filter((b) => b.tarifas.length > 0).length;
    const lugares = new Set<string>();
    for (const b of buses) for (const p of b.paradas) lugares.add(p.nombre.trim());
    return { totalParadas, conTarifas, totalLugares: lugares.size };
  }, [buses]);

  const resultadosBusqueda = useMemo(() => {
    if (!q.trim()) return [];
    return coincidenBuses(buses, q).slice(0, 6);
  }, [buses, q]);

  const proximos = useMemo(() => {
    const lista: { bus: Bus; hora: string; parada: string }[] = [];
    for (const s of dia) {
      const b = buses.find((x) => x.id === s.busId);
      if (!b) continue;
      const horaPaso = calcularHoraPaso(b, s.direccion, s.hora, s.paradaSubidaId);
      const m = horaAMinutos(horaPaso);
      if (m >= ahora - 5 && m <= ahora + 180) {
        lista.push({
          bus: b,
          hora: horaPaso,
          parada: buscarParada(b, s.paradaSubidaId)?.nombre || "",
        });
      }
    }
    return lista.sort((a, b) => horaAMinutos(a.hora) - horaAMinutos(b.hora));
  }, [dia, buses, ahora]);

  const favoritos = buses.filter((b) => b.favorito);

  const sinTarifas = buses.filter((b) => b.tarifas.length === 0);

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <img
          src="/imagenes/Logo.png"
          alt="Via"
          className="h-12 w-12 rounded-2xl object-contain"
        />
        <div>
          <h1 className="text-2xl font-extrabold text-tinta">Via</h1>
          <p className="text-sm text-subtinta">Tu guía de transporte</p>
        </div>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Busca un bus, ruta o lugar…"
        className="w-full rounded-2xl border-2 border-borde bg-card px-4 py-3 text-tinta outline-none placeholder:text-subtinta/60 focus:border-acc"
      />
      {resultadosBusqueda.length > 0 && (
        <div className="flex flex-col gap-2">
          {resultadosBusqueda.map((b) => (
            <button
              key={b.id}
              onClick={() => onNavegar("buses")}
              className="rounded-2xl border-2 border-borde bg-card px-4 py-2.5 text-left active:scale-[0.98]"
            >
              <span className="font-semibold text-tinta">{b.nombre}</span>
              <span className="ml-2 text-xs text-subtinta">
                {paradasDeBus(b).map((p) => p.nombre).join(" · ")}
              </span>
            </button>
          ))}
        </div>
      )}

      {buses.length === 0 && (
        <Tarjeta>
          <h2 className="mb-2 font-bold text-tinta">Bienvenido a Via 👋</h2>
          <div className="flex flex-col gap-2 text-sm text-subtinta">
            <p>Paso 1: en <b className="text-tinta">Buses</b> pulsa + Nuevo y guarda tu primer bus (ej: "Potrerillos - David").</p>
            <p>Paso 2: añade los lugares por donde pasa, sus horarios y las tarifas.</p>
            <p>Paso 3: en <b className="text-tinta">Hoy</b> elige qué buses tomarás y cuánto gastarás.</p>
            <p>Paso 4: en <b className="text-tinta">Lugares</b> consulta qué buses conectan dos sitios.</p>
          </div>
          <button
            onClick={() => onNavegar("buses")}
            className="mt-3 w-full rounded-2xl bg-acc py-3 font-bold text-onacc active:scale-[0.98]"
          >
            Añadir mi primer bus
          </button>
        </Tarjeta>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavegar("hoy")}
          className="rounded-3xl border-2 border-borde bg-card p-4 text-left active:scale-[0.98]"
        >
          <p className="text-xs font-semibold text-subtinta">Buses de hoy</p>
          <p className="mt-1 text-2xl font-extrabold text-tinta">{dia.length}</p>
          <p className="text-xs text-subtinta">
            Total{" "}
            <b className="text-acc">
              {totalDia.conocido ? `$${totalDia.total.toFixed(2)}` : "—"}
            </b>
          </p>
        </button>
        <button
          onClick={() => onNavegar("buses")}
          className="rounded-3xl border-2 border-borde bg-card p-4 text-left active:scale-[0.98]"
        >
          <p className="text-xs font-semibold text-subtinta">Mis buses</p>
          <p className="mt-1 text-2xl font-extrabold text-tinta">{buses.length}</p>
          <p className="text-xs text-subtinta">rutas guardadas</p>
        </button>
        <button
          onClick={() => onNavegar("lugares")}
          className="rounded-3xl border-2 border-borde bg-card p-4 text-left active:scale-[0.98]"
        >
          <p className="text-xs font-semibold text-subtinta">Lugares</p>
          <p className="mt-1 text-2xl font-extrabold text-tinta">
            {estadisticas.totalLugares}
          </p>
          <p className="text-xs text-subtinta">lugares en tus rutas</p>
        </button>
        <div className="rounded-3xl border-2 border-borde bg-card p-4 text-left">
          <p className="text-xs font-semibold text-subtinta">Paradas</p>
          <p className="mt-1 text-2xl font-extrabold text-tinta">
            {estadisticas.totalParadas}
          </p>
          <p className="text-xs text-subtinta">en total</p>
        </div>
      </div>

      {sinTarifas.length > 0 && (
        <button
          onClick={() => onNavegar("buses")}
          className="rounded-2xl border-2 border-amber-400/40 bg-amber-500/10 px-4 py-3 text-left text-sm active:scale-[0.98]"
        >
          <span className="font-bold text-amber-600">
            {sinTarifas.length} bus{sinTarifas.length === 1 ? "" : "es"} sin tarifas
          </span>
          <span className="ml-1 text-subtinta">
            — agrega los precios para que el total del día sea exacto.
          </span>
        </button>
      )}

      {proximos.length > 0 && (
        <div>
          <h2 className="mb-2 font-bold text-tinta">Próximos hoy</h2>
          <div className="flex flex-col gap-2">
            {proximos.map((p, i) => (
              <Tarjeta key={i}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-tinta">{p.bus.nombre}</p>
                    <p className="text-xs text-subtinta">Pasa por {p.parada}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-acc">{horaTexto(p.hora)}</p>
                    <p className="text-[10px] text-subtinta">
                      en {Math.max(0, horaAMinutos(p.hora) - ahora)} min
                    </p>
                  </div>
                </div>
              </Tarjeta>
            ))}
          </div>
        </div>
      )}

      {favoritos.length > 0 && (
        <div>
          <h2 className="mb-2 font-bold text-tinta">Favoritos</h2>
          <div className="flex flex-wrap gap-2">
            {favoritos.map((b) => (
              <button
                key={b.id}
                onClick={() => onNavegar("buses")}
                className="rounded-full border-2 border-amber-400/40 bg-card px-3 py-1.5 text-sm font-medium text-tinta"
              >
                ★ {b.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}