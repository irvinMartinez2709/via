import { useMemo, useState } from "react";
import type { Bus } from "../types";
import { normalizar } from "../lib/busquedas";
import { paradasDeBus, buscarParada } from "../lib/notificaciones";
import { Tarjeta, Combo } from "./ui";

interface LugarInfo {
  nombre: string;
  bus: Bus;
  paradaId: string;
}

export default function Lugares({ buses }: { buses: Bus[] }) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [q, setQ] = useState("");

  const lugares = useMemo(() => {
    const mapa = new Map<string, LugarInfo[]>();
    for (const b of buses) {
      for (const p of paradasDeBus(b)) {
        const key = normalizar(p.nombre);
        if (!mapa.has(key)) mapa.set(key, []);
        mapa.get(key)!.push({ nombre: p.nombre, bus: b, paradaId: p.id });
      }
    }
    return Array.from(mapa.values());
  }, [buses]);

  const nombresLugares = useMemo(() => {
    return Array.from(new Set(lugares.map((g) => g[0].nombre))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [lugares]);

  const lugaresFiltrados = useMemo(() => {
    if (!q.trim()) return lugares;
    const query = normalizar(q);
    return lugares.filter((grupo) => normalizar(grupo[0].nombre).includes(query));
  }, [lugares, q]);

  function precioEntre(bus: Bus, desdeId: string, hastaId: string): number | null {
    if (!desdeId || !hastaId || desdeId === hastaId) return null;
    const t = bus.tarifas.find((x) => x.desdeId === desdeId && x.hastaId === hastaId);
    return t ? t.precio : null;
  }

  type Resultado = {
    bus: Bus;
    desdeId: string;
    hastaId: string;
    precio: number | null;
  };

  function resultados(): Resultado[] {
    if (!desde && !hasta) return [];
    const desdeKey = normalizar(desde);
    const hastaKey = normalizar(hasta);
    const salida: Resultado[] = [];
    for (const grupo of lugares) {
      const nombre = normalizar(grupo[0].nombre);
      if (desde && hasta && nombre !== desdeKey && nombre !== hastaKey) continue;
      for (const info of grupo) {
        const esDesde = desde && nombre === desdeKey;
        const esHasta = hasta && nombre === hastaKey;
        if (!esDesde && !esHasta) continue;
        const otros = esDesde ? hasta : desde;
        const paradas = paradasDeBus(info.bus);
        const otraParada = paradas.find((p) => normalizar(p.nombre) === normalizar(otros));
        if (!otraParada) continue;
        const desdeId = esDesde ? info.paradaId : otraParada.id;
        const hastaId = esDesde ? otraParada.id : info.paradaId;
        salida.push({
          bus: info.bus,
          desdeId,
          hastaId,
          precio: precioEntre(info.bus, desdeId, hastaId),
        });
      }
    }
    const unicos = new Map<string, typeof salida[number]>();
    for (const r of salida) unicos.set(`${r.bus.id}-${r.desdeId}-${r.hastaId}`, r);
    return Array.from(unicos.values()).sort((a, b) => a.bus.nombre.localeCompare(b.bus.nombre));
  }

  const res = resultados();

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <h2 className="text-xl font-bold text-tinta">Lugares</h2>
      <p className="text-sm text-subtinta">
        Escribe dónde estás y dónde quieres ir (o elige de la lista). Via te dice qué
        buses pasan y cuánto cobran.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Combo
          label="Desde (dónde estoy)"
          valor={desde}
          alCambiar={setDesde}
          opciones={nombresLugares}
          placeholder="Ej: Dolega"
        />
        <Combo
          label="Hasta (a dónde voy)"
          valor={hasta}
          alCambiar={setHasta}
          opciones={nombresLugares}
          placeholder="Ej: David"
        />
      </div>

      <div>
        <Combo
          label="Buscar lugar"
          valor={q}
          alCambiar={setQ}
          opciones={nombresLugares}
          placeholder="Filtrar lista de lugares…"
          alElegir={(v) => setDesde(v)}
        />
      </div>

      {lugaresFiltrados.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-subtinta">
            Lugares guardados ({lugaresFiltrados.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {lugaresFiltrados.map((grupo, i) => (
              <button
                key={i}
                onClick={() => {
                  setDesde(grupo[0].nombre);
                }}
                className="rounded-full border-2 border-borde bg-card px-3 py-1.5 text-sm font-medium text-tinta active:scale-95"
              >
                {grupo[0].nombre}
                <span className="ml-1 text-[10px] text-subtinta">
                  ({grupo.length})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {res.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-tinta">Buses encontrados</p>
          {res.map((r, i) => (
            <Tarjeta key={i}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-tinta">{r.bus.nombre}</p>
                  <p className="text-sm text-subtinta">
                    {buscarParada(r.bus, r.desdeId)?.nombre} →{" "}
                    {buscarParada(r.bus, r.hastaId)?.nombre}
                  </p>
                  <p className="mt-1 text-xs text-subtinta">
                    Salidas:{" "}
                    {r.bus.salidasIda
                      .map((h) => `${h}`)
                      .concat(r.bus.salidasVuelta.map((h) => `${h}`))
                      .slice(0, 6)
                      .join(" · ")}
                    {r.bus.salidasIda.length + r.bus.salidasVuelta.length > 6
                      ? "…"
                      : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-acc">
                    {r.precio !== null ? `$${r.precio.toFixed(2)}` : "—"}
                  </p>
                  <p className="text-[10px] text-subtinta">
                    {r.precio === null ? "sin tarifa" : "por persona"}
                  </p>
                </div>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}

      {desde && hasta && res.length === 0 && (
        <Tarjeta>
          <p className="text-center text-sm text-subtinta">
            No hay buses que conecten {desde} y {hasta} con los datos guardados.
          </p>
        </Tarjeta>
      )}
    </div>
  );
}
