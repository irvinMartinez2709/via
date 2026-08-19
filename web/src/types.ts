export interface Parada {
  id: string;
  nombre: string;
  minutos: number;
  desfase: number;
}

export interface Tarifa {
  id: string;
  desdeId: string;
  hastaId: string;
  precio: number;
}

export interface Bus {
  id: string;
  nombre: string;
  lugarPrincipal: string;
  paradas: Parada[];
  salidasIda: string[];
  salidasVuelta: string[];
  tarifas: Tarifa[];
  favorito: boolean;
}

export interface SeleccionDia {
  id: string;
  busId: string;
  fecha: string;
  paradaSubidaId: string;
  paradaBajadaId: string;
  direccion: "ida" | "vuelta";
  hora: string;
  recordatorioMin: number;
}

export interface Config {
  recordatorioMin: number;
  color: string;
  emojis: "color" | "mono" | "ninguno";
}

export type Tema = "light" | "dark";

export interface Datos {
  buses: Bus[];
}

export const uuid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);

export const crearBus = (): Bus => ({
  id: uuid(),
  nombre: "",
  lugarPrincipal: "",
  paradas: [],
  salidasIda: [],
  salidasVuelta: [],
  tarifas: [],
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