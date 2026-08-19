import { useMemo, useState } from "react";
import type { Bus, Parada, Tarifa } from "../types";
import { uuid, crearBus } from "../types";
import { ordenarHoras, precioParse } from "../lib/busquedas";
import { Input, Tarjeta, Stepper, Combo, Selector, TarifaInput } from "./ui";
import ConfirmarDialog from "./ConfirmarDialog";

export default function BusFormulario({
  busInicial,
  lugares,
  onGuardar,
  onCancelar,
}: {
  busInicial: Bus | null;
  lugares: string[];
  onGuardar: (b: Bus) => void;
  onCancelar: () => void;
}) {
  const [bus, setBus] = useState<Bus>(() =>
    busInicial
      ? {
          ...busInicial,
          paradas: busInicial.paradas.map((p) => ({ ...p })),
          tarifas: busInicial.tarifas.map((t) => ({ ...t })),
        }
      : crearBus()
  );
  const [nuevaParada, setNuevaParada] = useState({ nombre: "" });
  const [horasIda, setHorasIda] = useState(busInicial?.salidasIda.join(", ") ?? "");
  const [horasVuelta, setHorasVuelta] = useState(
    busInicial?.salidasVuelta.join(", ") ?? ""
  );
  const [confirmarSalir, setConfirmarSalir] = useState(false);

  const nombrePartes = useMemo(() => {
    const partes = bus.nombre.split("-").map((p) => p.trim()).filter(Boolean);
    return partes;
  }, [bus.nombre]);

  const nombreValido = useMemo(
    () => nombrePartes.length >= 2 && nombrePartes.every((p) => p.length >= 2),
    [nombrePartes]
  );

  const paradasOrdenadas = useMemo(
    () => [...bus.paradas].sort((a, b) => a.minutos - b.minutos),
    [bus.paradas]
  );

  const primera = paradasOrdenadas[0];
  const ultima = paradasOrdenadas[paradasOrdenadas.length - 1];

  /* La tarifa del recorrido completo se edita en su propio campo; no se duplica en la lista */
  const tramos = useMemo(() => {
    if (!primera || !ultima) return bus.tarifas;
    return bus.tarifas.filter(
      (t) => !(t.desdeId === primera.id && t.hastaId === ultima.id)
    );
  }, [bus.tarifas, primera, ultima]);

  function setNombre(v: string) {
    const nuevo = { ...bus, nombre: v };
    const partes = v.split("-").map((p) => p.trim()).filter(Boolean);
    if (partes.length >= 1) nuevo.lugarPrincipal = partes[0];
    setBus(nuevo);
  }

  function agregarParada(nombreSugerido?: string) {
    const nombre = (nombreSugerido ?? nuevaParada.nombre).trim();
    if (!nombre) return;
    const p: Parada = {
      id: uuid(),
      nombre,
      minutos: bus.paradas.length
        ? Math.max(...bus.paradas.map((x) => x.minutos)) + 1
        : 0,
      desfase: 0,
    };
    setBus({ ...bus, paradas: [...bus.paradas, p] });
    setNuevaParada({ nombre: "" });
  }

  function editarParadaNombre(id: string, nombre: string) {
    setBus({
      ...bus,
      paradas: bus.paradas.map((p) => (p.id === id ? { ...p, nombre } : p)),
    });
  }

  function editarParadaMinutos(id: string, minutos: number) {
    setBus({
      ...bus,
      paradas: bus.paradas.map((p) => (p.id === id ? { ...p, minutos } : p)),
    });
  }

  function editarParadaDesfase(id: string, desfase: number) {
    setBus({
      ...bus,
      paradas: bus.paradas.map((p) => (p.id === id ? { ...p, desfase } : p)),
    });
  }

  function eliminarParada(id: string) {
    setBus({
      ...bus,
      paradas: bus.paradas.filter((p) => p.id !== id),
      tarifas: bus.tarifas.filter((t) => t.desdeId !== id && t.hastaId !== id),
    });
  }

  function tarifaPar(desdeId: string, hastaId: string): Tarifa | undefined {
    return bus.tarifas.find(
      (t) => t.desdeId === desdeId && t.hastaId === hastaId
    );
  }

  function ponerTarifa(desdeId: string, hastaId: string, texto: string) {
    if (!desdeId || !hastaId || desdeId === hastaId) return;
    const existe = tarifaPar(desdeId, hastaId);
    let tarifas: Tarifa[];
    if (texto.trim() === "") {
      tarifas = bus.tarifas.filter(
        (t) => !(t.desdeId === desdeId && t.hastaId === hastaId)
      );
    } else if (existe) {
      tarifas = bus.tarifas.map((t) =>
        t.desdeId === desdeId && t.hastaId === hastaId
          ? { ...t, precio: precioParse(texto) }
          : t
      );
    } else {
      tarifas = [...bus.tarifas, { id: uuid(), desdeId, hastaId, precio: precioParse(texto) }];
    }
    setBus({ ...bus, tarifas });
  }

  function añadirTramo() {
    setBus({
      ...bus,
      tarifas: [...bus.tarifas, { id: uuid(), desdeId: "", hastaId: "", precio: 0 }],
    });
  }

  function eliminarTarifa(id: string) {
    setBus({ ...bus, tarifas: bus.tarifas.filter((t) => t.id !== id) });
  }

  function editarTramo(id: string, cambio: Partial<Tarifa>) {
    setBus({
      ...bus,
      tarifas: bus.tarifas.map((t) => (t.id === id ? { ...t, ...cambio } : t)),
    });
  }

  function guardar() {
    if (!nombreValido) return;
    const salidasIda = ordenarHoras(horasIda.split(",").map((s) => s.trim()));
    const salidasVuelta = ordenarHoras(horasVuelta.split(",").map((s) => s.trim()));
    const tarifas = bus.tarifas
      .filter(
        (t) => t.desdeId && t.hastaId && t.desdeId !== t.hastaId
      )
      .reduce<Tarifa[]>((acc, t) => {
        const i = acc.findIndex(
          (x) => x.desdeId === t.desdeId && x.hastaId === t.hastaId
        );
        if (i >= 0) acc[i] = t;
        else acc.push(t);
        return acc;
      }, []);
    onGuardar({
      ...bus,
      nombre: nombrePartes.join(" - "),
      lugarPrincipal: nombrePartes[0],
      paradas: paradasOrdenadas,
      salidasIda,
      salidasVuelta,
      tarifas,
    });
  }

  function intentarSalir() {
    const dirty = bus.nombre.trim() || bus.paradas.length || bus.tarifas.length;
    if (dirty) setConfirmarSalir(true);
    else onCancelar();
  }

  return (
    <div className="flex flex-col gap-4 pb-32">
      <Tarjeta>
        <Input
          label="Nombre del bus"
          value={bus.nombre}
          onChange={setNombre}
          placeholder="Ej: Potrerillos - David"
        />
        <p className="mt-2 text-xs text-subtinta">
          Escribe los dos lugares separados por <b>-</b>. El lugar de la izquierda es el
          principal (donde inicia la ruta).
        </p>
        {nombrePartes.length === 1 && bus.nombre.trim() && (
          <p className="mt-2 rounded-xl bg-amber-500/15 px-3 py-2 text-xs text-amber-600">
            Falta el segundo lugar. Ejemplo correcto: <b>Potrerillos - David</b>
          </p>
        )}
        {bus.lugarPrincipal && nombrePartes.length >= 2 && (
          <p className="mt-2 text-xs font-semibold text-acc">
            Inicio de ruta: {bus.lugarPrincipal}
          </p>
        )}
      </Tarjeta>

      <Tarjeta>
        <h3 className="mb-1 font-bold text-tinta">Paradas de la ruta</h3>
        <p className="mb-3 text-xs text-subtinta">
          Añade los lugares por donde pasa el bus. Con los botones − / + indica{" "}
          <b>cuántos minutos tarda en llegar</b> desde que sale.
        </p>

        {paradasOrdenadas.map((p, i) => (
          <div key={p.id} className="mb-3 rounded-2xl border-2 border-borde bg-soft p-3">
            <div className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-center text-sm font-bold text-acc">
                {i + 1}
              </span>
              <Combo
                valor={p.nombre}
                alCambiar={(v) => editarParadaNombre(p.id, v)}
                opciones={lugares.filter((l) => l !== p.nombre)}
                placeholder="Nombre del lugar"
              />
              <button
                onClick={() => eliminarParada(p.id)}
                className="shrink-0 rounded-xl bg-red-500/10 px-3 py-2.5 font-bold text-red-500"
                title="Quitar parada"
              >
                ✕
              </button>
            </div>
            <div className="mt-3">
              <span className="mb-1 block text-xs font-semibold text-subtinta">
                Minutos en llegar desde la salida
              </span>
              <Stepper
                valor={p.minutos}
                alCambiar={(v) => editarParadaMinutos(p.id, v)}
                min={0}
                max={600}
                paso={1}
                sufijo="min"
              />
            </div>
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer font-semibold text-subtinta">
                ¿El bus pasa antes o después de lo que marca? (opcional)
              </summary>
              <div className="mt-2">
                <span className="mb-1 block text-xs font-semibold text-subtinta">
                  Pasa antes (−) o después (+) de lo marcado
                </span>
                <Stepper
                  valor={p.desfase ?? 0}
                  alCambiar={(v) => editarParadaDesfase(p.id, v)}
                  min={-120}
                  max={120}
                  paso={1}
                  sufijo="min"
                />
              </div>
            </details>
          </div>
        ))}

        <div className="mt-2">
          <Combo
            valor={nuevaParada.nombre}
            alCambiar={(v) => setNuevaParada({ nombre: v })}
            opciones={lugares.filter(
              (l) => !bus.paradas.some((p) => p.nombre.trim().toLowerCase() === l.toLowerCase())
            )}
            placeholder="Escribe o elige un lugar por donde pasa…"
            alElegir={(v) => agregarParada(v)}
          />
          <button
            onClick={() => agregarParada()}
            className="mt-2 w-full rounded-2xl bg-acc py-3 font-bold text-onacc active:scale-[0.98]"
          >
            + Añadir parada
          </button>
        </div>
        <p className="mt-2 text-xs text-subtinta">
          Puedes reutilizar lugares de otros buses (aparecen como sugerencias) para que
          Via entienda que varios buses pasan por el mismo sitio.
        </p>
      </Tarjeta>

      <Tarjeta>
        <h3 className="mb-1 font-bold text-tinta">Horarios de salida</h3>
        <p className="mb-3 text-xs text-subtinta">
          Escribe cada hora separada por comas. Ej: <b>6:00, 7:30, 11:00</b>
        </p>
        <Input
          label={`Salidas (${nombrePartes[0] || "lugar 1"} → ${nombrePartes[1] || "lugar 2"})`}
          value={horasIda}
          onChange={setHorasIda}
          placeholder="6:00, 7:30, 11:00"
        />
        <div className="mt-3">
          <Input
            label={`Salidas de vuelta (${nombrePartes[1] || "lugar 2"} → ${nombrePartes[0] || "lugar 1"})`}
            value={horasVuelta}
            onChange={setHorasVuelta}
            placeholder="6:30, 8:00, 12:00"
          />
        </div>
      </Tarjeta>

      {paradasOrdenadas.length >= 2 && (
        <Tarjeta>
          <h3 className="mb-1 font-bold text-tinta">Tarifas</h3>
          <p className="mb-3 text-xs text-subtinta">
            El precio es de subir en un lugar y bajar en otro. Deja vacío si no lo sabes;
            no pasa nada. Empieza por el precio del recorrido completo.
          </p>

          {primera && ultima && (
            <div className="mb-4 rounded-2xl border-2 border-acc bg-acc-suave p-3">
              <span className="mb-1 block text-xs font-semibold text-acc">
                Recorrido completo (opcional): {primera.nombre} → {ultima.nombre}
              </span>
              <TarifaInput
                valor={tarifaPar(primera.id, ultima.id)?.precio ?? null}
                alCambiar={(_precio, texto) =>
                  ponerTarifa(primera.id, ultima.id, texto)
                }
                placeholder="Precio del recorrido completo…"
              />
            </div>
          )}

          {tramos.length > 0 && (
            <div className="mb-3 flex flex-col gap-3">
              {tramos.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border-2 border-borde bg-soft p-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <Selector
                      label="Desde"
                      valor={t.desdeId}
                      alElegir={(id) => editarTramo(t.id, { desdeId: id })}
                      opciones={paradasOrdenadas.map((p) => ({
                        id: p.id,
                        texto: p.nombre,
                      }))}
                      placeholder="Lugar de subida…"
                    />
                    <Selector
                      label="Hasta"
                      valor={t.hastaId}
                      alElegir={(id) => editarTramo(t.id, { hastaId: id })}
                      opciones={paradasOrdenadas.map((p) => ({
                        id: p.id,
                        texto: p.nombre,
                      }))}
                      placeholder="Lugar de bajada…"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1">
                      <TarifaInput
                        valor={t.precio === 0 && (!t.desdeId || !t.hastaId) ? null : t.precio}
                        alCambiar={(_precio, texto) =>
                          ponerTarifa(t.desdeId, t.hastaId, texto)
                        }
                        placeholder="Precio…"
                      />
                    </div>
                    <button
                      onClick={() => eliminarTarifa(t.id)}
                      className="shrink-0 rounded-xl bg-red-500/10 px-3 py-2.5 font-bold text-red-500"
                      title="Quitar tramo"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={añadirTramo}
            className="w-full rounded-2xl border-2 border-dashed border-borde bg-card px-4 py-3 text-sm font-semibold text-subtinta active:scale-[0.98]"
          >
            + Añadir precio por tramo
          </button>
          <p className="mt-2 text-xs text-subtinta">
            Ejemplo: en "Potrerillos - David", si Dolega está en medio, añade el precio
            Potrerillos→Dolega y Dolega→David por separado (no se suman solos).
          </p>
        </Tarjeta>
      )}

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto flex max-w-2xl gap-3 px-4 pb-4">
        <button
          onClick={intentarSalir}
          className="rounded-2xl border-2 border-borde bg-card px-5 py-3 font-semibold text-tinta active:scale-95"
        >
          Cancelar
        </button>
        <button
          onClick={guardar}
          disabled={!nombreValido}
          className="flex-1 rounded-2xl bg-acc py-3 font-bold text-onacc shadow-lg disabled:opacity-40 active:scale-[0.98]"
        >
          {busInicial ? "Guardar cambios" : "Guardar bus"}
        </button>
      </div>

      {confirmarSalir && (
        <ConfirmarDialog
          titulo="Salir sin guardar"
          mensaje="Tienes cambios sin guardar. ¿Quieres salir?"
          confirmar={onCancelar}
          cancelar={() => setConfirmarSalir(false)}
          peligro
          textoConfirmar="Salir"
        />
      )}
    </div>
  );
}
