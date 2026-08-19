import { useEffect, useRef, useState } from "react";
import type { Config, Tema } from "../types";
import { COLOR_PRESETS } from "../types";
import { exportarTodo, importarTodo } from "../lib/almacen";
import { esColorHex } from "../lib/colores";
import {
  importarMapa,
  cargarMapa,
  quitarMapa,
  type InfoMapa,
} from "../lib/mapa";
import { Tarjeta, Emoji } from "./ui";
import ConfirmarDialog from "./ConfirmarDialog";

declare const __APP_VERSION__: string;

export default function Configuracion({
  config,
  tema,
  onConfig,
  onTema,
  onLimpiar,
  onAbrirMapa,
}: {
  config: Config;
  tema: Tema;
  onConfig: (c: Config) => void;
  onTema: (t: Tema) => void;
  onLimpiar: () => void;
  onAbrirMapa: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const mapaRef = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState("");
  const [confirmarLimpiar, setConfirmarLimpiar] = useState(false);
  const [confirmarImportar, setConfirmarImportar] = useState<string | null>(null);
  const [textoImportar, setTextoImportar] = useState("");
  const [estadoMapa, setEstadoMapa] = useState<InfoMapa | null>(null);

  const colorHex = esColorHex(config.color)
    ? config.color
    : COLOR_PRESETS.find((c) => c.id === config.color)?.preview || "#2563eb";

  useEffect(() => {
    void cargarMapa().then((r) => {
      if (r) setEstadoMapa(r.info);
    });
  }, []);

  async function importarMbtiles(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const buf = await f.arrayBuffer();
      const info = await importarMapa(buf);
      setEstadoMapa(info);
      setAviso("Mapa sin internet activado.");
      window.dispatchEvent(new Event("via:mapa"));
    } catch {
      setAviso("El archivo no es un mapa válido (.mbtiles).");
    }
    e.target.value = "";
  }

  async function quitarMbtiles() {
    await quitarMapa();
    setEstadoMapa(null);
    setAviso("Mapa sin internet quitado.");
    window.dispatchEvent(new Event("via:mapa"));
  }

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
            <Emoji>☀</Emoji> Claro
          </button>
          <button
            onClick={() => onTema("dark")}
            className={`flex-1 rounded-2xl border-2 px-4 py-2.5 font-semibold ${
              tema === "dark"
                ? "border-acc bg-acc text-onacc"
                : "border-borde bg-card text-subtinta"
            }`}
          >
            <Emoji>🌙</Emoji> Oscuro
          </button>
        </div>
      </Tarjeta>

      <Tarjeta>
        <h3 className="mb-1 font-bold text-tinta">Color de la app</h3>
        <p className="mb-3 text-xs text-subtinta">
          Los colores cambian toda la app (fondos, tarjetas y botones), no solo los
          detalles.
        </p>
        <div className="grid grid-cols-5 gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.id}
              onClick={() => onConfig({ ...config, color: c.id })}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 ${
                config.color === c.id
                  ? "border-acc bg-acc-suave"
                  : "border-borde bg-card"
              }`}
            >
              <span
                className="h-8 w-8 rounded-full border-2 border-black/10"
                style={{ backgroundColor: c.preview }}
              />
              <span
                className={`text-[10px] font-semibold ${
                  config.color === c.id ? "text-acc" : "text-subtinta"
                }`}
              >
                {c.nombre}
              </span>
            </button>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-semibold text-subtinta">
            Color personalizado
          </span>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={colorHex}
              onChange={(e) => onConfig({ ...config, color: e.target.value })}
              className="h-12 w-16 shrink-0 cursor-pointer rounded-xl border-2 border-borde bg-soft p-1"
            />
            <span className="text-xs text-subtinta">
              Elige el color que quieras con el selector.
            </span>
          </div>
        </label>
      </Tarjeta>

      <Tarjeta>
        <h3 className="mb-1 font-bold text-tinta">Iconos y emojis</h3>
        <p className="mb-3 text-xs text-subtinta">
          Elige cómo se ven los iconos de la app.
        </p>
        <div className="flex gap-2">
          {[
            { id: "color" as const, label: "De color", icono: "🎨" },
            { id: "mono" as const, label: "Blanco y negro", icono: "◐" },
            { id: "ninguno" as const, label: "Sin emojis", icono: "–" },
          ].map((o) => (
            <button
              key={o.id}
              onClick={() => onConfig({ ...config, emojis: o.id })}
              className={`flex-1 rounded-2xl border-2 px-3 py-2.5 font-semibold ${
                config.emojis === o.id
                  ? "border-acc bg-acc text-onacc"
                  : "border-borde bg-card text-subtinta"
              }`}
            >
              <Emoji>{o.icono}</Emoji> {o.label}
            </button>
          ))}
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
                ...config,
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
        <h3 className="mb-1 font-bold text-tinta">Mapa sin internet</h3>
        <p className="mb-3 text-xs text-subtinta">
          Descarga un archivo <b>.mbtiles</b> del mapa de Chiriquí (por ejemplo en{" "}
          <b>openmaptiles.org</b> o <b>osmbuildings.org</b>) y colócalo aquí. Luego verás
          el mapa de Chiriquí sin conexión en la sección "Mapa".
        </p>
        <button
          onClick={() => mapaRef.current?.click()}
          className="w-full rounded-2xl border-2 border-borde bg-soft px-4 py-3 font-semibold text-tinta active:scale-[0.98]"
        >
          Seleccionar archivo .mbtiles
        </button>
        <input
          ref={mapaRef}
          type="file"
          accept=".mbtiles,.sqlite,.db"
          className="hidden"
          onChange={importarMbtiles}
        />
        {estadoMapa && (
          <div className="mt-2 rounded-2xl bg-acc-suave px-3 py-2 text-xs font-semibold text-acc">
            {estadoMapa.nombre} — {estadoMapa.tiles} mosaicos
          </div>
        )}
        <div className="mt-2 flex flex-col gap-2">
          <button
            onClick={onAbrirMapa}
            className="w-full rounded-2xl bg-acc px-4 py-2.5 font-bold text-onacc active:scale-[0.98]"
          >
            Ver mapa
          </button>
          <button
            onClick={quitarMbtiles}
            className="w-full rounded-2xl bg-red-500/10 px-4 py-2.5 font-bold text-red-500 active:scale-[0.98]"
          >
            Quitar mapa sin internet
          </button>
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
            En "Mis buses" pulsa <b>+ Nuevo</b>. Escribe el nombre como{" "}
            <b>Lugar1 - Lugar2</b> (el principal va a la izquierda). Añade los lugares por
            donde pasa el bus, escribe los horarios de salida y, si quieres, el precio.
          </p>
        </details>
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿Qué son los "minutos en llegar desde la salida"?
          </summary>
          <p className="pt-1">
            Es cuánto tarda el bus en llegar a cada parada contando desde que sale. Por
            ejemplo: si sale a las 6:00 y una parada está a 10 minutos, el bus pasa por ahí
            a las 6:10. Ajusta el número con los botones − / +.
          </p>
        </details>
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿Y "pasa antes o después de lo marcado"?
          </summary>
          <p className="pt-1">
            Es opcional y casi nunca hace falta. Si en la parada el cartel dice que el bus
            pasa a una hora, pero en realidad siempre pasa más temprano o más tarde, lo
            ajustas aquí. Ejemplo: el bus pasa 5 min antes de lo que marca el horario →
            pon <b>−5</b>.
          </p>
        </details>
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿Cómo funcionan las tarifas?
          </summary>
          <p className="pt-1">
            Cada precio es de subir en un lugar y bajar en otro. Lo más fácil: escribe el{" "}
            <b>precio del recorrido completo</b> (de la primera a la última parada). Si los
            buses cobran distinto por tramos, añade precios por tramo con{" "}
            <b>+ Añadir precio por tramo</b>. No se suman solos; cada tramo tiene su precio.
          </p>
        </details>
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿Cuándo pasa el bus por mi parada?
          </summary>
          <p className="pt-1">
            En "Buses de hoy" eliges tu bus, dónde subes y a qué hora sale. Via suma los
            minutos de la parada y te dice la hora exacta de paso. Se recuerda 10 minutos
            antes.
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
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿Cómo funciona el mapa sin internet?
          </summary>
          <p className="pt-1">
            En "Más" puedes añadir un archivo <b>.mbtiles</b> del mapa de Chiriquí. Se
            guarda en tu teléfono y podrás verlo sin conexión en la sección "Mapa". Con
            internet, el mapa se muestra solo.
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