import type { Config, Datos, SeleccionDia, Tema } from "../types";

const CLAVE_DATOS = "via.datos.v1";
const CLAVE_DIA = "via.dia.v1";
const CLAVE_CONFIG = "via.config.v1";
const CLAVE_TEMA = "via.tema.v1";

const CONFIG_DEFECTO: Config = { recordatorioMin: 30 };

export function leerDatos(): Datos {
  try {
    const raw = localStorage.getItem(CLAVE_DATOS);
    if (!raw) return { buses: [] };
    const d = JSON.parse(raw) as Datos;
    return { buses: Array.isArray(d.buses) ? d.buses : [] };
  } catch {
    return { buses: [] };
  }
}

export function guardarDatos(d: Datos): void {
  try {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(d));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function leerDia(): SeleccionDia[] {
  try {
    const raw = localStorage.getItem(CLAVE_DIA);
    if (!raw) return [];
    const d = JSON.parse(raw);
    return Array.isArray(d) ? (d as SeleccionDia[]) : [];
  } catch {
    return [];
  }
}

export function guardarDia(d: SeleccionDia[]): void {
  try {
    localStorage.setItem(CLAVE_DIA, JSON.stringify(d));
  } catch {
    /* noop */
  }
}

export function leerConfig(): Config {
  try {
    const raw = localStorage.getItem(CLAVE_CONFIG);
    if (!raw) return { ...CONFIG_DEFECTO };
    return { ...CONFIG_DEFECTO, ...(JSON.parse(raw) as Partial<Config>) };
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
      version: 1,
      fecha: new Date().toISOString(),
      datos: leerDatos(),
      dia: leerDia(),
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
    if (Array.isArray(obj.dia)) guardarDia(obj.dia);
    if (obj.config && typeof obj.config === "object") guardarConfig(obj.config);
    if (obj.tema === "light" || obj.tema === "dark") guardarTema(obj.tema);
    return true;
  } catch {
    return false;
  }
}

export function borrarTodo(): void {
  localStorage.removeItem(CLAVE_DATOS);
  localStorage.removeItem(CLAVE_DIA);
  localStorage.removeItem(CLAVE_CONFIG);
  localStorage.removeItem(CLAVE_TEMA);
}

export { CLAVE_DATOS, CLAVE_DIA, CLAVE_CONFIG, CLAVE_TEMA };
