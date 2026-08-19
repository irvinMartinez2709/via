export interface Parada {
  id: string;
  nombre: string;
  minutos: number;
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
