import type { Bus } from "../types";
import { horaTexto } from "../lib/busquedas";
import { paradasDeBus } from "../lib/notificaciones";
import ConfirmarDialog from "./ConfirmarDialog";
import { useState } from "react";

export default function BusCard({
  bus,
  onEditar,
  onEliminar,
  onFavorito,
}: {
  bus: Bus;
  onEditar: () => void;
  onEliminar: () => void;
  onFavorito: () => void;
}) {
  const [confirmar, setConfirmar] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const paradas = paradasDeBus(bus);
  const tarifas = [...bus.tarifas];

  return (
    <div className="animate-fade-in rounded-3xl border-2 border-borde bg-card p-4">
      <div className="flex items-start gap-3">
        <button
          onClick={onFavorito}
          className={`text-2xl leading-none transition ${
            bus.favorito ? "text-amber-400" : "text-subtinta/40"
          }`}
          title={bus.favorito ? "Quitar favorito" : "Marcar favorito"}
        >
          ★
        </button>
        <button onClick={() => setExpandido((v) => !v)} className="min-w-0 flex-1 text-left">
          <h3 className="truncate text-lg font-bold text-tinta">{bus.nombre}</h3>
          <p className="text-xs text-subtinta">
            {paradas.length} paradas · {bus.salidasIda.length} salidas{" "}
            <span className="text-acc">→</span> · {bus.salidasVuelta.length} salidas{" "}
            <span className="text-acc">←</span>
          </p>
        </button>
        <div className="flex flex-col gap-1">
          <button
            onClick={onEditar}
            className="rounded-xl bg-soft px-3 py-1.5 text-sm font-bold text-acc active:scale-95"
          >
            Editar
          </button>
          <button
            onClick={() => setConfirmar(true)}
            className="rounded-xl bg-red-500/10 px-3 py-1.5 text-sm font-bold text-red-500 active:scale-95"
          >
            Borrar
          </button>
        </div>
      </div>

      {expandido && (
        <div className="mt-3 space-y-3 border-t-2 border-borde pt-3 text-sm">
          {paradas.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-subtinta">Ruta</p>
              <div className="flex flex-wrap items-center gap-1">
                {paradas.map((p, i) => (
                  <span key={p.id} className="flex items-center gap-1">
                    <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-medium text-tinta">
                      {p.nombre}
                      {p.minutos > 0 && (
                        <span className="ml-1 text-[10px] text-subtinta">
                          +{p.minutos} min
                        </span>
                      )}
                    </span>
                    {i < paradas.length - 1 && <span className="text-subtinta">→</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {bus.salidasIda.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-subtinta">
                {bus.nombre.split(" - ")[0] || "Ida"} →{" "}
                {bus.nombre.split(" - ")[1] || "destino"}
              </p>
              <div className="flex flex-wrap gap-1">
                {bus.salidasIda.map((h) => (
                  <span
                    key={h}
                    className="rounded-lg bg-soft px-2 py-0.5 text-xs font-medium text-tinta"
                  >
                    {horaTexto(h)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {bus.salidasVuelta.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-subtinta">
                {bus.nombre.split(" - ")[1] || "Destino"} →{" "}
                {bus.nombre.split(" - ")[0] || "ida"}
              </p>
              <div className="flex flex-wrap gap-1">
                {bus.salidasVuelta.map((h) => (
                  <span
                    key={h}
                    className="rounded-lg bg-soft px-2 py-0.5 text-xs font-medium text-tinta"
                  >
                    {horaTexto(h)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tarifas.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-subtinta">Tarifas</p>
              <div className="flex flex-col gap-1">
                {tarifas.slice(0, 8).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl bg-soft px-3 py-1.5 text-xs"
                  >
                    <span className="text-tinta">
                      {paradas.find((p) => p.id === t.desdeId)?.nombre} →{" "}
                      {paradas.find((p) => p.id === t.hastaId)?.nombre}
                    </span>
                    <span className="font-bold text-acc">${t.precio.toFixed(2)}</span>
                  </div>
                ))}
                {tarifas.length > 8 && (
                  <p className="text-[10px] text-subtinta">
                    +{tarifas.length - 8} tarifas más
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {confirmar && (
        <ConfirmarDialog
          titulo="Eliminar bus"
          mensaje={
            <>
              ¿Seguro que quieres eliminar{" "}
              <b className="text-tinta">{bus.nombre}</b>? También se quitará de tus buses
              del día.
            </>
          }
          confirmar={() => {
            onEliminar();
            setConfirmar(false);
          }}
          cancelar={() => setConfirmar(false)}
          peligro
          textoConfirmar="Eliminar"
        />
      )}
    </div>
  );
}
