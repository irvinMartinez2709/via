import { useMemo, useState } from "react";
import type { Bus, Lugar } from "../types";
import { normalizar, coincideFuzzy } from "../lib/busquedas";
import { Tarjeta } from "./ui";
import ConfirmarDialog from "./ConfirmarDialog";

export default function Lugares({
  lugares,
  buses,
  onAñadir,
  onRenombrar,
  onEliminar,
}: {
  lugares: Lugar[];
  buses: Bus[];
  onAñadir: (nombre: string) => Lugar | null;
  onRenombrar: (id: string, nombre: string) => void;
  onEliminar: (id: string) => void;
}) {
  const [nuevo, setNuevo] = useState("");
  const [q, setQ] = useState("");
  const [aviso, setAviso] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEdit, setTextoEdit] = useState("");
  const [borrar, setBorrar] = useState<Lugar | null>(null);

  const uso = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const b of buses) {
      for (const id of new Set([...b.ida, ...b.vuelta])) {
        mapa.set(id, (mapa.get(id) || 0) + 1);
      }
    }
    return mapa;
  }, [buses]);

  const filtrados = useMemo(() => {
    const lista = [...lugares].sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (!q.trim()) return lista;
    return lista.filter((l) => coincideFuzzy(l.nombre, q));
  }, [lugares, q]);

  function añadir() {
    const nombre = nuevo.trim();
    if (!nombre) return;
    const duplicado = lugares.some(
      (l) => normalizar(l.nombre) === normalizar(nombre)
    );
    if (duplicado) {
      setAviso(`"${nombre}" ya existe en tus lugares.`);
      setNuevo("");
      return;
    }
    const creado = onAñadir(nombre);
    if (creado) {
      setAviso("");
      setNuevo("");
    }
  }

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <h2 className="text-xl font-bold text-tinta">Lugares</h2>
      <p className="text-sm text-subtinta">
        Crea los lugares por donde pasan tus buses (ej: Potrerillos Abajo, La acequia,
        Dolega, David…). Luego podrás elegirlos al crear las rutas de cada bus.
      </p>

      <Tarjeta>
        <div className="flex gap-2">
          <input
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") añadir();
            }}
            placeholder="Nombre del lugar…"
            className="min-w-0 flex-1 rounded-2xl border-2 border-borde bg-soft px-4 py-3 text-tinta outline-none placeholder:text-subtinta/60 focus:border-acc"
          />
          <button
            onClick={añadir}
            className="shrink-0 rounded-2xl bg-acc px-4 py-3 font-bold text-onacc active:scale-95"
          >
            + Añadir
          </button>
        </div>
        {aviso && <p className="mt-2 text-xs font-semibold text-amber-600">{aviso}</p>}
      </Tarjeta>

      {lugares.length > 3 && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar lugar escribiendo…"
          className="w-full rounded-2xl border-2 border-borde bg-card px-4 py-3 text-tinta outline-none placeholder:text-subtinta/60 focus:border-acc"
        />
      )}

      {lugares.length === 0 ? (
        <Tarjeta>
          <p className="text-center text-sm text-subtinta">
            Aún no hay lugares. Escribe el primero arriba, por ejemplo{" "}
            <b className="text-tinta">Potrerillos Abajo</b>.
          </p>
        </Tarjeta>
      ) : filtrados.length === 0 ? (
        <Tarjeta>
          <p className="text-center text-sm text-subtinta">
            Ningún lugar coincide con "{q}".
          </p>
        </Tarjeta>
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map((l) => {
            const enUso = uso.get(l.id) || 0;
            if (editandoId === l.id) {
              return (
                <Tarjeta key={l.id}>
                  <div className="flex gap-2">
                    <input
                      value={textoEdit}
                      onChange={(e) => setTextoEdit(e.target.value)}
                      autoFocus
                      className="min-w-0 flex-1 rounded-2xl border-2 border-borde bg-soft px-3 py-2.5 text-tinta outline-none focus:border-acc"
                    />
                    <button
                      onClick={() => {
                        if (textoEdit.trim()) onRenombrar(l.id, textoEdit.trim());
                        setEditandoId(null);
                      }}
                      className="shrink-0 rounded-2xl bg-acc px-4 py-2.5 font-bold text-onacc active:scale-95"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="shrink-0 rounded-2xl border-2 border-borde bg-soft px-3 py-2.5 font-bold text-subtinta active:scale-95"
                    >
                      ✕
                    </button>
                  </div>
                </Tarjeta>
              );
            }
            return (
              <div
                key={l.id}
                className="flex items-center gap-2 rounded-3xl border-2 border-borde bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-tinta">{l.nombre}</p>
                  <p className="text-xs text-subtinta">
                    {enUso === 0
                      ? "Sin buses todavía"
                      : `En ${enUso} bus${enUso === 1 ? "" : "es"}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditandoId(l.id);
                    setTextoEdit(l.nombre);
                  }}
                  aria-label={`Renombrar ${l.nombre}`}
                  className="h-10 w-10 shrink-0 rounded-xl border-2 border-borde bg-soft text-subtinta active:scale-95"
                >
                  ✎
                </button>
                <button
                  onClick={() => setBorrar(l)}
                  aria-label={`Eliminar ${l.nombre}`}
                  className="h-10 w-10 shrink-0 rounded-xl border-2 border-borde bg-soft text-red-500 active:scale-95"
                >
                  🗑
                </button>
              </div>
            );
          })}
        </div>
      )}

      {borrar && (
        <ConfirmarDialog
          titulo={`Eliminar "${borrar.nombre}"`}
          mensaje={
            <>
              Se quitará de las rutas de tus buses y de tus gastos. Esta acción no se
              puede deshacer.
            </>
          }
          confirmar={() => {
            onEliminar(borrar.id);
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
