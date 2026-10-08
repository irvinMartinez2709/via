import type { Config, Datos, Tema } from "../types";

const CLAVE_DATOS = "via.datos.v2";
const CLAVE_CONFIG = "via.config.v1";
const CLAVE_TEMA = "via.tema.v1";

const CONFIG_DEFECTO: Config = { color: "azul", emojis: "color", formatoHora: "12" };

const DATOS_VACIOS: Datos = { lugares: [], buses: [], gastos: [] };

export function leerDatos(): Datos {
  try {
    const raw = localStorage.getItem(CLAVE_DATOS);
    if (!raw) return { ...DATOS_VACIOS };
    const d = JSON.parse(raw) as Partial<Datos>;
    return {
      lugares: Array.isArray(d.lugares) ? d.lugares : [],
      buses: Array.isArray(d.buses)
        ? d.buses.map((b) => ({
            ...b,
            ida: Array.isArray(b.ida) ? b.ida : [],
            vuelta: Array.isArray(b.vuelta) ? b.vuelta : [],
            horarios:
              b.horarios && Array.isArray(b.horarios.ida) && Array.isArray(b.horarios.vuelta)
                ? {
                    ida: b.horarios.ida,
                    vuelta: b.horarios.vuelta,
                  }
                : { ida: [], vuelta: [] },
            favorito: !!b.favorito,
          }))
        : [],
      gastos: Array.isArray(d.gastos) ? d.gastos : [],
    };
  } catch {
    return { ...DATOS_VACIOS };
  }
}

export function guardarDatos(d: Datos): void {
  try {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(d));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function leerConfig(): Config {
  try {
    const raw = localStorage.getItem(CLAVE_CONFIG);
    if (!raw) return { ...CONFIG_DEFECTO };
    const c = JSON.parse(raw) as Partial<Config>;
    return {
      ...CONFIG_DEFECTO,
      ...c,
      color: typeof c.color === "string" && c.color ? c.color : CONFIG_DEFECTO.color,
      emojis:
        c.emojis === "mono" || c.emojis === "ninguno" ? c.emojis : CONFIG_DEFECTO.emojis,
      formatoHora: c.formatoHora === "24" ? "24" : "12",
    };
  } catch {
    return { ...CONFIG_DEFECTO };
  }
}

export function guardarConfig(c: Config): void {
  try {
    localStorage.setItem(CLAVE_CONFIG, JSON.stringify(c));
  } catch {
    /* noop */
  }
}

export function leerTema(): Tema {
  try {
    const t = localStorage.getItem(CLAVE_TEMA);
    return t === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function guardarTema(t: Tema): void {
  try {
    localStorage.setItem(CLAVE_TEMA, t);
  } catch {
    /* noop */
  }
}

export function exportarTodo(): string {
  return JSON.stringify(
    {
      app: "Via",
      version: 2,
      fecha: new Date().toISOString(),
      datos: leerDatos(),
      config: leerConfig(),
      tema: leerTema(),
    },
    null,
    2
  );
}

export function importarTodo(texto: string): boolean {
  try {
    const obj = JSON.parse(texto);
    if (!obj || typeof obj !== "object") return false;
    if (obj.datos && typeof obj.datos === "object") guardarDatos(obj.datos);
    if (obj.config && typeof obj.config === "object") guardarConfig(obj.config);
    if (obj.tema === "light" || obj.tema === "dark") guardarTema(obj.tema);
    return true;
  } catch {
    return false;
  }
}

export function borrarTodo(): void {
  localStorage.removeItem(CLAVE_DATOS);
  localStorage.removeItem(CLAVE_CONFIG);
  localStorage.removeItem(CLAVE_TEMA);
}

export { CLAVE_DATOS, CLAVE_CONFIG, CLAVE_TEMA };
