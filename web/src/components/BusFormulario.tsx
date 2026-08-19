import { useMemo, useState } from "react";
import type { Bus, Parada, Tarifa } from "../types";
import { uuid, crearBus } from "../types";
import {
  ordenarHoras,
  precioParse,
  esNumeroPrecio,
} from "../lib/busquedas";
import { Input, Tarjeta, Stepper, Combo } from "./ui";
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
      minutos: bus.paradas.length ? Math.max(...bus.paradas.map((x) => x.minutos)) + 5 : 0,
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

  function setTarifa(desdeId: string, hastaId: string, valor: string) {
    if (desdeId === hastaId) return;
    if (valor.trim() === "") {
      setBus({
        ...bus,
        tarifas: bus.tarifas.filter(
          (t) => !(t.desdeId === desdeId && t.hastaId === hastaId)
        ),
      });
      return;
    }
    if (!esNumeroPrecio(valor)) return;
    const precio = precioParse(valor);
    const existe = bus.tarifas.find(
      (t) => t.desdeId === desdeId && t.hastaId === hastaId
    );
    let tarifas: Tarifa[];
    if (existe) {
      tarifas = bus.tarifas.map((t) =>
        t.desdeId === desdeId && t.hastaId === hastaId ? { ...t, precio } : t
      );
    } else {
      tarifas = [...bus.tarifas, { id: uuid(), desdeId, hastaId, precio }];
    }
    setBus({ ...bus, tarifas });
  }

  function tarifaDe(desdeId: string, hastaId: string): string {
    const t = bus.tarifas.find(
      (x) => x.desdeId === desdeId && x.hastaId === hastaId
    );
    return t ? t.precio.toFixed(2) : "";
  }

  function guardar() {
    if (!nombreValido) return;
    const salidasIda = ordenarHoras(horasIda.split(",").map((s) => s.trim()));
    const salidasVuelta = ordenarHoras(horasVuelta.split(",").map((s) => s.trim()));
    onGuardar({
      ...bus,
      nombre: nombrePartes.join(" - "),
      lugarPrincipal: nombrePartes[0],
      paradas: paradasOrdenadas,
      salidasIda,
      salidasVuelta,
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
          Añade los lugares por donde pasa el bus en orden. Con los botones − / + ajusta
          los <b>minutos desde la salida</b> y si el bus pasa <b>antes</b> (desfase −) o{" "}
          <b>después</b> (desfase +) de lo que marca el horario.
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
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <span className="mb-1 block text-xs font-semibold text-subtinta">
                  Minutos desde la salida
                </span>
                <Stepper
                  valor={p.minutos}
                  alCambiar={(v) => editarParadaMinutos(p.id, v)}
                  min={0}
                  max={600}
                  paso={5}
                  sufijo="min"
                />
              </div>
              <div>
                <span className="mb-1 block text-xs font-semibold text-subtinta">
                  Pasa antes (−) o después (+)
                </span>
                <Stepper
                  valor={p.desfase ?? 0}
                  alCambiar={(v) => editarParadaDesfase(p.id, v)}
                  min={-120}
                  max={120}
                  paso={5}
                  sufijo="min"
                />
              </div>
            </div>
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
            Escribe el precio de subir en un lugar y bajar en otro. Los buses cobran por
            tramo: deja vacío si no hay precio para ese tramo.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-1" />
                  {paradasOrdenadas.map((p) => (
                    <th
                      key={p.id}
                      className="max-w-[90px] truncate p-1 text-xs font-semibold text-subtinta"
                    >
                      {p.nombre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paradasOrdenadas.map((desde) => (
                  <tr key={desde.id}>
                    <td className="max-w-[90px] truncate p-1 text-xs font-semibold text-subtinta">
                      {desde.nombre}
                    </td>
                    {paradasOrdenadas.map((hasta) => (
                      <td key={hasta.id} className="p-1">
                        {desde.id === hasta.id ? (
                          <div className="h-9" />
                        ) : (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={tarifaDe(desde.id, hasta.id)}
                            onChange={(e) =>
                              setTarifa(desde.id, hasta.id, e.target.value)
                            }
                            placeholder="–"
                            className="h-9 w-16 rounded-lg border-2 border-borde bg-soft px-1 text-center text-tinta outline-none focus:border-acc"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-subtinta">
            Ejemplo: en "Potrerillos - David", si Dolega está en medio, escribe el precio
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