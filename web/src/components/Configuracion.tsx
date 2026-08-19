import { useRef, useState } from "react";
import type { Config, Tema } from "../types";
import { exportarTodo, importarTodo } from "../lib/almacen";
import { Tarjeta } from "./ui";
import ConfirmarDialog from "./ConfirmarDialog";

declare const __APP_VERSION__: string;

export default function Configuracion({
  config,
  tema,
  onConfig,
  onTema,
  onLimpiar,
}: {
  config: Config;
  tema: Tema;
  onConfig: (c: Config) => void;
  onTema: (t: Tema) => void;
  onLimpiar: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState("");
  const [confirmarLimpiar, setConfirmarLimpiar] = useState(false);
  const [confirmarImportar, setConfirmarImportar] = useState<string | null>(null);
  const [textoImportar, setTextoImportar] = useState("");

  function exportar() {
    const blob = new Blob([exportarTodo()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `via-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setAviso("Respaldo exportado.");
  }

  function importarDesdeArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importarTodo(String(reader.result));
      if (ok) {
        setAviso("Datos importados. Recarga la app para verlos.");
        window.location.reload();
      } else {
        setAviso("El archivo no es válido.");
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  }

  function importarPegado() {
    const ok = importarTodo(textoImportar);
    if (ok) {
      setAviso("Datos importados. Recarga la app para verlos.");
      window.location.reload();
    } else {
      setAviso("El texto no es un respaldo válido.");
    }
  }

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <h2 className="text-xl font-bold text-tinta">Configuración</h2>

      <Tarjeta>
        <h3 className="mb-3 font-bold text-tinta">Apariencia</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onTema("light")}
            className={`flex-1 rounded-2xl border-2 px-4 py-2.5 font-semibold ${
              tema === "light"
                ? "border-acc bg-acc text-onacc"
                : "border-borde bg-card text-subtinta"
            }`}
          >
            ☀ Claro
          </button>
          <button
            onClick={() => onTema("dark")}
            className={`flex-1 rounded-2xl border-2 px-4 py-2.5 font-semibold ${
              tema === "dark"
                ? "border-acc bg-acc text-onacc"
                : "border-borde bg-card text-subtinta"
            }`}
          >
            🌙 Oscuro
          </button>
        </div>
      </Tarjeta>

      <Tarjeta>
        <h3 className="mb-3 font-bold text-tinta">Recordatorios</h3>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-subtinta">
            Recordatorio predeterminado (minutos antes)
          </span>
          <input
            type="tel"
            inputMode="numeric"
            value={config.recordatorioMin}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              onConfig({
                recordatorioMin: isNaN(n) ? 0 : Math.min(600, Math.max(0, n)),
              });
            }}
            className="w-full rounded-2xl border-2 border-borde bg-soft px-4 py-3 text-tinta outline-none focus:border-acc"
          />
        </label>
        <p className="mt-2 text-xs text-subtinta">
          Además siempre se recuerda 10 minutos antes de la hora a la que pasa el bus.
        </p>
      </Tarjeta>

      <Tarjeta>
        <h3 className="mb-3 font-bold text-tinta">Datos</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={exportar}
            className="rounded-2xl border-2 border-borde bg-soft px-4 py-3 font-semibold text-tinta active:scale-[0.98]"
          >
            Exportar respaldo (JSON)
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl border-2 border-borde bg-soft px-4 py-3 font-semibold text-tinta active:scale-[0.98]"
          >
            Importar desde archivo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={importarDesdeArchivo}
          />
          <details className="rounded-2xl border-2 border-borde bg-soft px-4 py-3">
            <summary className="cursor-pointer font-semibold text-tinta">
              Pegar respaldo (JSON)
            </summary>
            <textarea
              value={textoImportar}
              onChange={(e) => setTextoImportar(e.target.value)}
              placeholder='{"app":"Via",…}'
              className="mt-2 w-full rounded-xl border-2 border-borde bg-card px-3 py-2 text-xs text-tinta outline-none focus:border-acc"
              rows={4}
            />
            <button
              onClick={importarPegado}
              className="mt-2 w-full rounded-xl bg-acc px-4 py-2 font-bold text-onacc"
            >
              Importar
            </button>
          </details>
        </div>
      </Tarjeta>

      <Tarjeta>
        <h3 className="mb-1 font-bold text-tinta">Acerca de</h3>
        <div className="text-sm text-subtinta">
          <p>
            <b className="text-tinta">Via</b> — Tu guía de transporte
          </p>
          <p>Versión {__APP_VERSION__}</p>
          <p>Plataforma: Android</p>
          <p>Datos guardados solo en tu dispositivo.</p>
        </div>
      </Tarjeta>

      <Tarjeta>
        <h3 className="mb-1 font-bold text-tinta">Ayuda rápida</h3>
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿Cómo agrego un bus?
          </summary>
          <p className="pt-1">
            En "Mis buses" pulsa + Nuevo. Pon el nombre como "Lugar1 - Lugar2" (el
            principal va a la izquierda). Luego añade paradas con los minutos que tarda en
            llegar, los horarios de salida y las tarifas.
          </p>
        </details>
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿Cómo funcionan las tarifas?
          </summary>
          <p className="pt-1">
            Cada precio es de subir en un lugar y bajar en otro. No se suman tramos
            automáticamente porque los buses cobran distinto por tramo; defines el precio
            exacto de cada par de paradas.
          </p>
        </details>
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿Cuándo pasa el bus por mi parada?
          </summary>
          <p className="pt-1">
            En el formulario del bus cada parada tiene "min" (cuántos minutos tarda desde
            la salida en el lugar principal). Con eso, Via calcula la hora exacta a la que
            pasa por cada lugar en ambos sentidos.
          </p>
        </details>
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿Cómo funcionan los recordatorios?
          </summary>
          <p className="pt-1">
            Al añadir un bus a "Buses de hoy" puedes poner cuántos minutos antes avisar
            (por defecto 30). Siempre habrá también un aviso 10 minutos antes de que pase
            por tu parada.
          </p>
        </details>
      </Tarjeta>

      <Tarjeta>
        <button
          onClick={() => setConfirmarLimpiar(true)}
          className="w-full rounded-2xl bg-red-500/10 px-4 py-3 font-bold text-red-500 active:scale-[0.98]"
        >
          Borrar todos los datos
        </button>
      </Tarjeta>

      {aviso && (
        <p className="rounded-xl bg-soft px-3 py-2 text-center text-sm text-subtinta">
          {aviso}
        </p>
      )}

      {confirmarLimpiar && (
        <ConfirmarDialog
          titulo="Borrar todos los datos"
          mensaje="Se eliminarán todos los buses, tus buses de hoy y la configuración. Esta acción no se puede deshacer."
          confirmar={async () => {
            await onLimpiar();
            setConfirmarLimpiar(false);
            setAviso("Datos borrados.");
          }}
          cancelar={() => setConfirmarLimpiar(false)}
          peligro
          textoConfirmar="Borrar todo"
        />
      )}

      {confirmarImportar && (
        <ConfirmarDialog
          titulo="Importar datos"
          mensaje={confirmarImportar}
          confirmar={() => {
            setConfirmarImportar(null);
            importarPegado();
          }}
          cancelar={() => setConfirmarImportar(null)}
        />
      )}
    </div>
  );
}
