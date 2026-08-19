import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as AppPlugin } from "@capacitor/app";
import { useDatos } from "./hooks/useDatos";
import Splash from "./components/Splash";
import Inicio from "./components/Inicio";
import GestionarBuses from "./components/GestionarBuses";
import BusesHoy from "./components/BusesHoy";
import Lugares from "./components/Lugares";
import Configuracion from "./components/Configuracion";
import { Emoji } from "./components/ui";
import { cancelarRecordatorios } from "./lib/notificaciones";
import { lugaresDeBuses } from "./lib/busquedas";

type Seccion = "inicio" | "buses" | "hoy" | "lugares" | "config";

export default function App() {
  const [cargando, setCargando] = useState(true);
  const [seccion, setSeccion] = useState<Seccion>("inicio");
  const d = useDatos();
  const ultimoBack = useRef(0);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", d.tema === "dark");
    html.classList.toggle("light", d.tema === "light");
    html.setAttribute("data-color", d.config.color);
    html.setAttribute("data-emojis", d.config.emojis);
  }, [d.tema, d.config]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const h = AppPlugin.addListener("backButton", () => {
      const ahora = Date.now();
      if (ahora - ultimoBack.current < 2000) {
        AppPlugin.exitApp();
      } else {
        ultimoBack.current = ahora;
        setAvisoBack(true);
        setTimeout(() => setAvisoBack(false), 2000);
      }
    });
    return () => {
      void h.then((l) => l.remove());
    };
  }, []);

  async function eliminarSeleccionConRecordatorio(id: string, minutos: number[]) {
    await cancelarRecordatorios(id, minutos);
    d.eliminarSeleccion(id);
  }

  const [avisoBack, setAvisoBack] = useState(false);
  const lugares = lugaresDeBuses(d.datos.buses);

  const nav = [
    { id: "inicio" as Seccion, label: "Inicio", icono: "🏠" },
    { id: "buses" as Seccion, label: "Buses", icono: "🚌" },
    { id: "hoy" as Seccion, label: "Hoy", icono: "📅" },
    { id: "lugares" as Seccion, label: "Lugares", icono: "📍" },
    { id: "config" as Seccion, label: "Más", icono: "⚙️" },
  ];

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
      {cargando && <Splash onDone={() => setCargando(false)} />}

      <main className="flex-1 px-4 pb-28 pt-4">
        {seccion === "inicio" && (
          <Inicio buses={d.datos.buses} dia={d.dia} onNavegar={(s) => setSeccion(s as Seccion)} />
        )}
        {seccion === "buses" && (
          <GestionarBuses
            buses={d.datos.buses}
            lugares={lugares}
            onGuardar={d.guardarBus}
            onEliminar={d.eliminarBus}
            onToggleFavorito={d.toggleFavorito}
          />
        )}
        {seccion === "hoy" && (
          <BusesHoy
            buses={d.datos.buses}
            dia={d.dia}
            config={d.config}
            onAñadir={d.añadirSeleccion}
            onEliminar={(id) => {
              const s = d.dia.find((x) => x.id === id);
              if (s) void eliminarSeleccionConRecordatorio(id, [s.recordatorioMin]);
              else d.eliminarSeleccion(id);
            }}
          />
        )}
        {seccion === "lugares" && <Lugares buses={d.datos.buses} />}
        {seccion === "config" && (
          <Configuracion
            config={d.config}
            tema={d.tema}
            onConfig={d.actualizarConfig}
            onTema={d.cambiarTema}
            onLimpiar={d.limpiarTodo}
          />
        )}
      </main>

      {avisoBack && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div className="rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-lg">
            Pulsa atrás otra vez para salir
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-borde bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-stretch">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => setSeccion(n.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
                seccion === n.id ? "text-acc" : "text-subtinta"
              }`}
            >
              <Emoji className="text-lg leading-none">{n.icono}</Emoji>
              {n.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}