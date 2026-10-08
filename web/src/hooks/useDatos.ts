import { useCallback, useState } from "react";
import type { Bus, Config, Datos, Gasto, Lugar, Salida, Sentido, Tema } from "../types";
import { crearLugar, uuid } from "../types";
import {
  borrarTodo,
  guardarConfig,
  guardarDatos,
  guardarTema,
  leerConfig,
  leerDatos,
  leerTema,
} from "../lib/almacen";
import { normalizar } from "../lib/busquedas";

export function useDatos() {
  const [datos, setDatos] = useState<Datos>(() => leerDatos());
  const [config, setConfig] = useState<Config>(() => leerConfig());
  const [tema, setTema] = useState<Tema>(() => leerTema());

  const actualizar = useCallback((fn: (d: Datos) => Datos) => {
    setDatos((prev) => {
      const nuevo = fn(prev);
      guardarDatos(nuevo);
      return nuevo;
    });
  }, []);

  const añadirLugar = useCallback(
    (nombre: string): Lugar | null => {
      const limpio = nombre.trim();
      if (!limpio) return null;
      let creado: Lugar | null = null;
      actualizar((d) => {
        const existe = d.lugares.find((l) => normalizar(l.nombre) === normalizar(limpio));
        if (existe) {
          creado = existe;
          return d;
        }
        creado = crearLugar(limpio);
        return { ...d, lugares: [...d.lugares, creado] };
      });
      return creado;
    },
    [actualizar]
  );

  /** Devuelve el lugar con ese nombre (lo crea si no existe). */
  const asegurarLugar = useCallback(
    (nombre: string): Lugar | null => {
      const limpio = nombre.trim();
      if (!limpio) return null;
      const yaExiste = datos.lugares.find(
        (l) => normalizar(l.nombre) === normalizar(limpio)
      );
      if (yaExiste) return yaExiste;
      return añadirLugar(limpio);
    },
    [datos.lugares, añadirLugar]
  );

  const renombrarLugar = useCallback(
    (id: string, nombre: string) => {
      const limpio = nombre.trim();
      if (!limpio) return;
      actualizar((d) => ({
        ...d,
        lugares: d.lugares.map((l) => (l.id === id ? { ...l, nombre: limpio } : l)),
        buses: d.buses.map((b) => ({
          ...b,
          origen: b.origen && d.lugares.find((l) => l.id === id && l.nombre === b.origen) ? limpio : b.origen,
          destino: b.destino && d.lugares.find((l) => l.id === id && l.nombre === b.destino) ? limpio : b.destino,
        })),
      }));
    },
    [actualizar]
  );

  const eliminarLugar = useCallback(
    (id: string) => {
      actualizar((d) => ({
        lugares: d.lugares.filter((l) => l.id !== id),
        buses: d.buses.map((b) => ({
          ...b,
          ida: b.ida.filter((x) => x !== id),
          vuelta: b.vuelta.filter((x) => x !== id),
        })),
        gastos: d.gastos.filter((g) => g.desdeId !== id && g.hastaId !== id),
      }));
    },
    [actualizar]
  );

  const guardarBus = useCallback(
    (bus: Bus) => {
      actualizar((d) => {
        const existe = d.buses.some((b) => b.id === bus.id);
        return {
          ...d,
          buses: existe
            ? d.buses.map((b) => (b.id === bus.id ? bus : b))
            : [...d.buses, bus],
        };
      });
    },
    [actualizar]
  );

  const guardarRutas = useCallback(
    (busId: string, sentido: Sentido, ruta: string[]) => {
      actualizar((d) => ({
        ...d,
        buses: d.buses.map((b) =>
          b.id === busId ? { ...b, [sentido]: ruta } : b
        ),
      }));
    },
    [actualizar]
  );

  const guardarHorarios = useCallback(
    (busId: string, sentido: Sentido, salidas: Salida[]) => {
      actualizar((d) => ({
        ...d,
        buses: d.buses.map((b) =>
          b.id === busId
            ? { ...b, horarios: { ...b.horarios, [sentido]: salidas } }
            : b
        ),
      }));
    },
    [actualizar]
  );

  const eliminarBus = useCallback(
    (id: string) => {
      actualizar((d) => ({
        ...d,
        buses: d.buses.filter((b) => b.id !== id),
        gastos: d.gastos.filter((g) => g.busId !== id),
      }));
    },
    [actualizar]
  );

  const toggleFavorito = useCallback(
    (id: string) => {
      actualizar((d) => ({
        ...d,
        buses: d.buses.map((b) => (b.id === id ? { ...b, favorito: !b.favorito } : b)),
      }));
    },
    [actualizar]
  );

  const registrarGasto = useCallback(
    (g: Omit<Gasto, "id" | "fecha">) => {
      actualizar((d) => ({
        ...d,
        gastos: [
          ...d.gastos,
          { ...g, id: uuid(), fecha: new Date().toISOString() },
        ],
      }));
    },
    [actualizar]
  );

  const eliminarGasto = useCallback(
    (id: string) => {
      actualizar((d) => ({ ...d, gastos: d.gastos.filter((g) => g.id !== id) }));
    },
    [actualizar]
  );

  const actualizarConfig = useCallback((c: Config) => {
    setConfig(c);
    guardarConfig(c);
  }, []);

  const cambiarTema = useCallback((t: Tema) => {
    setTema(t);
    guardarTema(t);
  }, []);

  const limpiarTodo = useCallback(() => {
    borrarTodo();
    setDatos({ lugares: [], buses: [], gastos: [] });
    setConfig(leerConfig());
    setTema(leerTema());
  }, []);

  return {
    datos,
    config,
    tema,
    añadirLugar,
    asegurarLugar,
    renombrarLugar,
    eliminarLugar,
    guardarBus,
    guardarRutas,
    guardarHorarios,
    eliminarBus,
    toggleFavorito,
    registrarGasto,
    eliminarGasto,
    actualizarConfig,
    cambiarTema,
    limpiarTodo,
  };
}
