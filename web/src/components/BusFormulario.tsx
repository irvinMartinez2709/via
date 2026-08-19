import { useMemo, useState } from "react";
import type { Bus, Parada, Tarifa } from "../types";
import { uuid, crearBus } from "../types";
import {
  ordenarHoras,
  precioParse,
  esNumeroPrecio,
} from "../lib/busquedas";
import { Input, Tarjeta } from "./ui";
import ConfirmarDialog from "./ConfirmarDialog";

export default function BusFormulario({
  busInicial,
  onGuardar,
  onCancelar,
}: {
  busInicial: Bus | null;
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
  const [nuevaParada, setNuevaParada] = useState({ nombre: "", minutos: "" });
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

  function agregarParada() {
    const nombre = nuevaParada.nombre.trim();
    if (!nombre) return;
    const minutos = parseInt(nuevaParada.minutos || "0", 10);
    const p: Parada = {
      id: uuid(),
      nombre,
      minutos: isNaN(minutos) ? 0 : Math.max(0, minutos),
    };
    setBus({ ...bus, paradas: [...bus.paradas, p] });
    setNuevaParada({ nombre: "", minutos: "" });
  }

  function editarParada(id: string, campo: "nombre" | "minutos", valor: string) {
    setBus({
      ...bus,
      paradas: bus.paradas.map((p) =>
        p.id === id
          ? {
              ...p,
              nombre:
                campo === "nombre"
                  ? valor
                  : p.nombre,
              minutos: campo === "minutos" ? (parseInt(valor, 10) || 0) : p.minutos,
            }
          : p
      ),
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
    return t ? String(t.precio).replace(".", ".") : "";
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
          label="Nombre del bus (Lugar1 - Lugar2)"
          value={bus.nombre}
          onChange={setNombre}
          placeholder="Ej: Potrerillos - David"
        />
        {nombrePartes.length === 1 && bus.nombre.trim() && (
          <p className="mt-2 text-xs text-subtinta">
            Separa los dos lugares con " - ". El lugar principal (izquierda) será el
            primero.
          </p>
        )}
        {bus.lugarPrincipal && (
          <p className="mt-2 text-xs font-semibold text-acc">
            Lugar principal: {bus.lugarPrincipal}
          </p>
        )}
      </Tarjeta>

      <Tarjeta>
        <h3 className="mb-3 font-bold text-tinta">Paradas de la ruta</h3>
        <p className="mb-3 text-xs text-subtinta">
          Escribe cuántos minutos tarda el bus en llegar a cada parada desde el lugar
          principal (salida ida).
        </p>
        {paradasOrdenadas.map((p, i) => (
          <div key={p.id} className="mb-2 flex items-center gap-2">
            <span className="w-5 text-center text-sm font-bold text-subtinta">
              {i + 1}
            </span>
            <input
              value={p.nombre}
              onChange={(e) => editarParada(p.id, "nombre", e.target.value)}
              placeholder="Parada"
              className="min-w-0 flex-1 rounded-xl border-2 border-borde bg-soft px-3 py-2 text-tinta outline-none focus:border-acc"
            />
            <input
              type="tel"
              value={p.minutos === 0 ? "" : String(p.minutos)}
              onChange={(e) => editarParada(p.id, "minutos", e.target.value)}
              placeholder="min"
              className="w-16 rounded-xl border-2 border-borde bg-soft px-2 py-2 text-center text-tinta outline-none focus:border-acc"
            />
            <button
              onClick={() => eliminarParada(p.id)}
              className="rounded-xl bg-red-500/10 px-3 py-2 font-bold text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
        <div className="mt-2 flex gap-2">
          <input
            value={nuevaParada.nombre}
            onChange={(e) =>
              setNuevaParada((s) => ({ ...s, nombre: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && agregarParada()}
            placeholder="Nombre de la parada"
            className="min-w-0 flex-1 rounded-xl border-2 border-borde bg-soft px-3 py-2 text-tinta outline-none focus:border-acc"
          />
          <input
            type="tel"
            value={nuevaParada.minutos}
            onChange={(e) =>
              setNuevaParada((s) => ({ ...s, minutos: e.target.value }))
            }
            placeholder="min"
            className="w-20 rounded-xl border-2 border-borde bg-soft px-2 py-2 text-center text-tinta outline-none focus:border-acc"
          />
          <button
            onClick={agregarParada}
            className="rounded-xl bg-acc px-4 font-bold text-onacc"
          >
            +
          </button>
        </div>
      </Tarjeta>

      <Tarjeta>
        <h3 className="mb-1 font-bold text-tinta">Horarios de salida</h3>
        <p className="mb-3 text-xs text-subtinta">
          Separa con comas. Ej: 6:00, 7:30, 11:00
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
            Precio de subir en un lugar y bajar en otro. Deja vacío si no hay precio.
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
                            type="tel"
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
            Ej: en "Potrerillos - David", si Dolega está en medio, pones el precio de
            Potrerillos→Dolega y Dolega→David con sus propios valores (no se suman
            automáticamente; los buses cobran por tramo).
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
