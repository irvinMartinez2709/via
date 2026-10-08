import { useMemo } from "react";
import type { Bus, Gasto, Lugar } from "../types";
import { nombreBus } from "../types";
import { precioTexto } from "../lib/busquedas";
import { cadenaTexto, nombresDe } from "../lib/rutas";
import { Tarjeta } from "./ui";

export default function Inicio({
  buses,
  lugares,
  gastos,
  onNavegar,
}: {
  buses: Bus[];
  lugares: Lugar[];
  gastos: Gasto[];
  onNavegar: (seccion: string) => void;
}) {
  const sinRutas = useMemo(
    () => buses.filter((b) => b.ida.length === 0 || b.vuelta.length === 0),
    [buses]
  );

  const favoritos = buses.filter((b) => b.favorito);

  const recientes = useMemo(
    () => [...gastos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 3),
    [gastos]
  );

  const vacio = lugares.length === 0 && buses.length === 0;

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

      {vacio && (
        <Tarjeta>
          <h2 className="mb-2 font-bold text-tinta">Bienvenido a Via 👋</h2>
          <div className="flex flex-col gap-2 text-sm text-subtinta">
            <p>
              <b className="text-acc">Paso 1:</b> en <b className="text-tinta">Lugares</b>{" "}
              crea los sitios por donde pasan los buses (Potrerillos Abajo, La acequia,
              Dolega, David…).
            </p>
            <p>
              <b className="text-acc">Paso 2:</b> en <b className="text-tinta">Buses</b>{" "}
              añade un bus con dos cuadros (origen – destino) y dale a{" "}
              <b className="text-tinta">Añadir rutas</b> para elegir los lugares de ida y
              de vuelta.
            </p>
            <p>
              <b className="text-acc">Paso 3:</b> en <b className="text-tinta">Viaje</b>{" "}
              pregunta “de dónde vengo y a dónde voy” y elige bus; en{" "}
              <b className="text-tinta">Gastos</b> apunta cuánto gastaste.
            </p>
          </div>
          <button
            onClick={() => onNavegar("lugares")}
            className="mt-3 w-full rounded-2xl bg-acc py-3 font-bold text-onacc active:scale-[0.98]"
          >
            Crear mi primer lugar
          </button>
        </Tarjeta>
      )}

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onNavegar("lugares")}
          className="rounded-3xl border-2 border-borde bg-card p-4 text-left active:scale-[0.98]"
        >
          <p className="text-xs font-semibold text-subtinta">Lugares</p>
          <p className="mt-1 text-2xl font-extrabold text-tinta">{lugares.length}</p>
          <p className="text-[10px] text-subtinta">creados</p>
        </button>
        <button
          onClick={() => onNavegar("buses")}
          className="rounded-3xl border-2 border-borde bg-card p-4 text-left active:scale-[0.98]"
        >
          <p className="text-xs font-semibold text-subtinta">Buses</p>
          <p className="mt-1 text-2xl font-extrabold text-tinta">{buses.length}</p>
          <p className="text-[10px] text-subtinta">guardados</p>
        </button>
        <button
          onClick={() => onNavegar("gastos")}
          className="rounded-3xl border-2 border-borde bg-card p-4 text-left active:scale-[0.98]"
        >
          <p className="text-xs font-semibold text-subtinta">Gastos</p>
          <p className="mt-1 text-2xl font-extrabold text-tinta">{gastos.length}</p>
          <p className="text-[10px] text-subtinta">registrados</p>
        </button>
      </div>

      {!vacio && (
        <button
          onClick={() => onNavegar("viaje")}
          className="rounded-3xl border-2 border-acc bg-acc-suave p-4 text-left active:scale-[0.98]"
        >
          <p className="text-xs font-bold text-acc">¿A dónde vas?</p>
          <p className="mt-0.5 text-sm font-semibold text-tinta">
            Busca un bus de tu punto A al punto B →
          </p>
        </button>
      )}

      {sinRutas.length > 0 && (
        <button
          onClick={() => onNavegar("buses")}
          className="rounded-2xl border-2 border-amber-400/40 bg-amber-500/10 px-4 py-3 text-left text-sm active:scale-[0.98]"
        >
          <span className="font-bold text-amber-600">
            {sinRutas.length} bus{sinRutas.length === 1 ? "" : "es"} sin rutas completas
          </span>
          <span className="ml-1 text-subtinta">
            — pulsa “Añadir rutas” para elegir ida y vuelta.
          </span>
        </button>
      )}

      {buses.length > 0 && (
        <Tarjeta>
          <h3 className="mb-2 font-bold text-tinta">Tus rutas</h3>
          <div className="flex flex-col gap-2">
            {buses.slice(0, 4).map((b) => (
              <button
                key={b.id}
                onClick={() => onNavegar("buses")}
                className="rounded-2xl bg-soft px-3 py-2 text-left active:scale-[0.99]"
              >
                <p className="truncate text-sm font-bold text-tinta">
                  {b.favorito ? "★ " : ""}
                  {nombreBus(b)}
                </p>
                <p className="truncate text-[11px] text-subtinta">
                  {b.ida.length
                    ? cadenaTexto(nombresDe(lugares, b.ida))
                    : "Sin ruta de ida"}
                </p>
              </button>
            ))}
          </div>
        </Tarjeta>
      )}

      {favoritos.length > 0 && (
        <div>
          <h3 className="mb-2 font-bold text-tinta">Favoritos</h3>
          <div className="flex flex-wrap gap-2">
            {favoritos.map((b) => (
              <button
                key={b.id}
                onClick={() => onNavegar("buses")}
                className="rounded-full border-2 border-amber-400/40 bg-card px-3 py-1.5 text-sm font-medium text-tinta"
              >
                ★ {nombreBus(b)}
              </button>
            ))}
          </div>
        </div>
      )}

      {recientes.length > 0 && (
        <div>
          <h3 className="mb-2 font-bold text-tinta">Últimos gastos</h3>
          <div className="flex flex-col gap-2">
            {recientes.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-2 rounded-2xl border-2 border-borde bg-card px-4 py-2.5"
              >
                <p className="min-w-0 truncate text-sm text-tinta">
                  {lugares.find((l) => l.id === g.desdeId)?.nombre || "?"} →{" "}
                  {lugares.find((l) => l.id === g.hastaId)?.nombre || "?"}
                </p>
                <p className="shrink-0 font-extrabold text-acc">
                  {precioTexto(g.monto)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
