import { useRef, useState } from "react";
import type { Config, Tema } from "../types";
import { COLOR_PRESETS } from "../types";
import { exportarTodo, importarTodo } from "../lib/almacen";
import { esColorHex } from "../lib/colores";
import { Tarjeta, Emoji } from "./ui";
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
  const [textoImportar, setTextoImportar] = useState("");

  const colorHex = esColorHex(config.color)
    ? config.color
    : COLOR_PRESETS.find((c) => c.id === config.color)?.preview || "#2563eb";

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
        <h3 className="mb-1 font-bold text-tinta">Formato de hora</h3>
        <p className="mb-3 text-xs text-subtinta">
          Cómo se muestran los horarios de los buses en toda la app.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onConfig({ ...config, formatoHora: "12" })}
            className={`flex-1 rounded-2xl border-2 px-4 py-2.5 font-semibold ${
              config.formatoHora === "12"
                ? "border-acc bg-acc text-onacc"
                : "border-borde bg-card text-subtinta"
            }`}
          >
            1:10 p. m. <span className="text-xs">(12 h)</span>
          </button>
          <button
            onClick={() => onConfig({ ...config, formatoHora: "24" })}
            className={`flex-1 rounded-2xl border-2 px-4 py-2.5 font-semibold ${
              config.formatoHora === "24"
                ? "border-acc bg-acc text-onacc"
                : "border-borde bg-card text-subtinta"
            }`}
          >
            13:10 <span className="text-xs">(24 h militar)</span>
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
            ¿Cómo creo un bus?
          </summary>
          <p className="pt-1">
            En <b>Buses</b> verás dos cuadros: el de la <b>izquierda</b> es el origen y el
            de la <b>derecha</b> el destino (ej: <b>Potrerillos Abajo</b> –{" "}
            <b>David</b>). Pulsa <b>+ Añadir bus</b>. Si el lugar no existía, se crea solo.
          </p>
        </details>
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿Cómo añado las rutas de un bus?
          </summary>
          <p className="pt-1">
            En la tarjeta del bus pulsa <b>Añadir rutas</b>. Se abre una lista con tus
            lugares: toca para añadirlos en orden (usa ↑ ↓ para reordenar). La{" "}
            <b>ida</b> y la <b>vuelta</b> se eligen por separado porque las calles no son
            las mismas. Puedes buscar escribiendo o deslizando la lista.
          </p>
        </details>
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿Qué es la jerarquía de nodos?
          </summary>
          <p className="pt-1">
            El orden de los lugares forma una cadena como{" "}
            <b>David ↔ Algarrobos ↔ Altamar ↔ Dolega</b>. Así sabes por dónde pasa el bus
            antes de llegar y qué tan lejos está un lugar de otro.
          </p>
        </details>
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿Cómo pongo los horarios de un bus?
          </summary>
          <p className="pt-1">
            En la tarjeta del bus pulsa <b>⏰ Horarios</b>. Elige <b>Ida</b> o{" "}
            <b>Vuelta</b> y añade una hora de salida; luego pon la hora a la que pasa por
            cada lugar de esa ruta (los subhorarios). No son exactas: ajústalas a tu
            gusto. El formato (1:10 p. m. o 13:10) lo cambias en{" "}
            <b>Formato de hora</b>.
          </p>
        </details>
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿Cómo encuentro un bus de A a B?
          </summary>
          <p className="pt-1">
            En <b>Viaje</b> escribes de dónde vienes y a dónde vas. Via lista los buses
            que pasan por esos dos lugares y te muestra los lugares por los que pasas
            para llegar. Al tocar un bus se ven sus horarios, tus gastos registrados en
            ese tramo y su ruta en Google Maps (necesita internet).
          </p>
        </details>
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿Cómo registro lo que gasté?
          </summary>
          <p className="pt-1">
            En <b>Gastos</b> eliges el lugar A y el B (solo si existe algún bus que cumpla
            esa ruta), seleccionas el bus que usaste, escribes el monto y pulsas{" "}
            <b>Guardar gasto</b>. Tus gastos quedan en la lista de abajo.
          </p>
        </details>
        <details className="text-sm text-subtinta">
          <summary className="cursor-pointer py-1 font-semibold text-tinta">
            ¿El mapa funciona sin internet?
          </summary>
          <p className="pt-1">
            No: el mapa usa un iframe de Google Maps y solo se muestra cuando hay
            conexión. Sin internet verás el recorrido escrito igualmente.
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
          mensaje="Se eliminarán tus lugares, buses, rutas y gastos. Esta acción no se puede deshacer."
          confirmar={() => {
            onLimpiar();
            setConfirmarLimpiar(false);
            setAviso("Datos borrados.");
          }}
          cancelar={() => setConfirmarLimpiar(false)}
          peligro
          textoConfirmar="Borrar todo"
        />
      )}
    </div>
  );
}
