export type Sentido = "ida" | "vuelta";

export type FormatoHora = "12" | "24";

export interface Lugar {
  id: string;
  nombre: string;
}

/** Hora a la que el bus pasa por un lugar de la ruta. Vacío = sin hora aún. */
export interface Llegada {
  lugarId: string;
  hora: string;
}

/** Una salida del bus (un horario) con la hora de paso por cada nodo de la ruta. */
export interface Salida {
  id: string;
  llegadas: Llegada[];
}

export interface Horarios {
  ida: Salida[];
  vuelta: Salida[];
}

export interface Bus {
  id: string;
  origen: string;
  destino: string;
  ida: string[];
  vuelta: string[];
  horarios: Horarios;
  favorito: boolean;
}

export interface Gasto {
  id: string;
  busId: string;
  desdeId: string;
  hastaId: string;
  monto: number;
  fecha: string;
}

export interface Config {
  color: string;
  emojis: "color" | "mono" | "ninguno";
  formatoHora: FormatoHora;
}

export type Tema = "light" | "dark";

export interface Datos {
  lugares: Lugar[];
  buses: Bus[];
  gastos: Gasto[];
}

export const uuid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);

export const nombreBus = (b: Bus): string => `${b.origen} - ${b.destino}`;

export const crearLugar = (nombre: string): Lugar => ({
  id: uuid(),
  nombre: nombre.trim(),
});

export const crearBus = (origen: string, destino: string): Bus => ({
  id: uuid(),
  origen: origen.trim(),
  destino: destino.trim(),
  ida: [],
  vuelta: [],
  horarios: { ida: [], vuelta: [] },
  favorito: false,
});

export const COLOR_PRESETS: {
  id: string;
  nombre: string;
  preview: string;
  light: string;
  dark: string;
}[] = [
  { id: "azul", nombre: "Azul", preview: "#2563eb", light: "#2563eb", dark: "#60a5fa" },
  { id: "verde", nombre: "Verde", preview: "#22c55e", light: "#16a34a", dark: "#4ade80" },
  { id: "rojo", nombre: "Rojo", preview: "#ef4444", light: "#dc2626", dark: "#f87171" },
  { id: "morado", nombre: "Morado", preview: "#8b5cf6", light: "#7c3aed", dark: "#a78bfa" },
  { id: "naranja", nombre: "Naranja", preview: "#f97316", light: "#ea580c", dark: "#fb923c" },
  { id: "rosa", nombre: "Rosa", preview: "#ec4899", light: "#db2777", dark: "#f472b6" },
  { id: "teal", nombre: "Teal", preview: "#14b8a6", light: "#0d9488", dark: "#2dd4bf" },
  { id: "ambar", nombre: "Ámbar", preview: "#f59e0b", light: "#b45309", dark: "#fbbf24" },
  { id: "cielo", nombre: "Cielo", preview: "#06b6d4", light: "#0891b2", dark: "#22d3ee" },
  { id: "gris", nombre: "Gris", preview: "#64748b", light: "#475569", dark: "#94a3b8" },
];
