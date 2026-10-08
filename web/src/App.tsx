import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as AppPlugin } from "@capacitor/app";
import { useDatos } from "./hooks/useDatos";
import Splash from "./components/Splash";
import Inicio from "./components/Inicio";
import Lugares from "./components/Lugares";
import GestionarBuses from "./components/GestionarBuses";
import Viajar from "./components/Viajar";
import Gastos from "./components/Gastos";
import Configuracion from "./components/Configuracion";
import { Emoji } from "./components/ui";
import { aplicarPaleta } from "./lib/colores";

type Seccion = "inicio" | "lugares" | "buses" | "viaje" | "gastos" | "config";

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
    aplicarPaleta(d.config.color, d.tema);
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

  const [avisoBack, setAvisoBack] = useState(false);

  const nav = [
    { id: "inicio" as Seccion, label: "Inicio", icono: "🏠" },
    { id: "lugares" as Seccion, label: "Lugares", icono: "📍" },
    { id: "buses" as Seccion, label: "Buses", icono: "🚌" },
    { id: "viaje" as Seccion, label: "Viaje", icono: "🧭" },
    { id: "gastos" as Seccion, label: "Gastos", icono: "💵" },
    { id: "config" as Seccion, label: "Más", icono: "⚙️" },
  ];

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
      {cargando && <Splash onDone={() => setCargando(false)} />}

      <main className="flex-1 px-4 pb-28 pt-4">
        {seccion === "inicio" && (
          <Inicio
            buses={d.datos.buses}
            lugares={d.datos.lugares}
            gastos={d.datos.gastos}
            onNavegar={(s) => setSeccion(s as Seccion)}
          />
        )}
        {seccion === "lugares" && (
          <Lugares
            lugares={d.datos.lugares}
            buses={d.datos.buses}
            onAñadir={d.añadirLugar}
            onRenombrar={d.renombrarLugar}
            onEliminar={d.eliminarLugar}
          />
        )}
        {seccion === "buses" && (
          <GestionarBuses
            buses={d.datos.buses}
            lugares={d.datos.lugares}
            formatoHora={d.config.formatoHora}
            onGuardarBus={d.guardarBus}
            onEliminarBus={d.eliminarBus}
            onToggleFavorito={d.toggleFavorito}
            onAsegurarLugar={d.asegurarLugar}
            onGuardarHorarios={d.guardarHorarios}
          />
        )}
        {seccion === "viaje" && (
          <Viajar
            buses={d.datos.buses}
            lugares={d.datos.lugares}
            gastos={d.datos.gastos}
            formatoHora={d.config.formatoHora}
          />
        )}
        {seccion === "gastos" && (
          <Gastos
            buses={d.datos.buses}
            lugares={d.datos.lugares}
            gastos={d.datos.gastos}
            onRegistrar={d.registrarGasto}
            onEliminar={d.eliminarGasto}
          />
        )}
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
