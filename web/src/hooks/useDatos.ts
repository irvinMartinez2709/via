import { useCallback, useState } from "react";
import type { Bus, Config, Datos, SeleccionDia, Tema } from "../types";
import {
  guardarConfig,
  guardarDatos,
  guardarDia,
  guardarTema,
  leerConfig,
  leerDatos,
  leerDia,
  leerTema,
  borrarTodo,
} from "../lib/almacen";
import { cancelarTodos } from "../lib/notificaciones";

export function useDatos() {
  const [datos, setDatos] = useState<Datos>(() => leerDatos());
  const [dia, setDia] = useState<SeleccionDia[]>(() => leerDia());
  const [config, setConfig] = useState<Config>(() => leerConfig());
  const [tema, setTema] = useState<Tema>(() => leerTema());

  const actualizarDatos = useCallback((fn: (d: Datos) => Datos) => {
    setDatos((prev) => {
      const nuevo = fn(prev);
      guardarDatos(nuevo);
      return nuevo;
    });
  }, []);

  const guardarBus = useCallback(
    (bus: Bus) => {
      actualizarDatos((d) => {
        const existe = d.buses.some((b) => b.id === bus.id);
        return {
          buses: existe
            ? d.buses.map((b) => (b.id === bus.id ? bus : b))
            : [...d.buses, bus],
        };
      });
    },
    [actualizarDatos]
  );

  const eliminarBus = useCallback(
    (id: string) => {
      actualizarDatos((d) => ({ buses: d.buses.filter((b) => b.id !== id) }));
      setDia((prev) => {
        const nuevo = prev.filter((s) => s.busId !== id);
        guardarDia(nuevo);
        return nuevo;
      });
    },
    [actualizarDatos]
  );

  const toggleFavorito = useCallback(
    (id: string) => {
      actualizarDatos((d) => ({
        buses: d.buses.map((b) => (b.id === id ? { ...b, favorito: !b.favorito } : b)),
      }));
    },
    [actualizarDatos]
  );

  const actualizarDia = useCallback((fn: (d: SeleccionDia[]) => SeleccionDia[]) => {
    setDia((prev) => {
      const nuevo = fn(prev);
      guardarDia(nuevo);
      return nuevo;
    });
  }, []);

  const añadirSeleccion = useCallback(
    (s: SeleccionDia) => {
      actualizarDia((prev) => [...prev, s]);
    },
    [actualizarDia]
  );

  const eliminarSeleccion = useCallback(
    (id: string) => {
      actualizarDia((prev) => prev.filter((s) => s.id !== id));
    },
    [actualizarDia]
  );

  const actualizarSeleccion = useCallback(
    (s: SeleccionDia) => {
      actualizarDia((prev) => prev.map((x) => (x.id === s.id ? s : x)));
    },
    [actualizarDia]
  );

  const actualizarConfig = useCallback((c: Config) => {
    setConfig(c);
    guardarConfig(c);
  }, []);

  const cambiarTema = useCallback((t: Tema) => {
    setTema(t);
    guardarTema(t);
  }, []);

  const limpiarTodo = useCallback(async () => {
    borrarTodo();
    await cancelarTodos();
    setDatos({ buses: [] });
    setDia([]);
    setConfig(leerConfig());
    setTema(leerTema());
  }, []);

  return {
    datos,
    dia,
    config,
    tema,
    guardarBus,
    eliminarBus,
    toggleFavorito,
    añadirSeleccion,
    eliminarSeleccion,
    actualizarSeleccion,
    actualizarConfig,
    cambiarTema,
    limpiarTodo,
  };
}
