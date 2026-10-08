import type { Bus, Lugar, Sentido } from "../types";
import { normalizar } from "./busquedas";

export function buscarLugarPorNombre(lugares: Lugar[], nombre: string): Lugar | undefined {
  const q = normalizar(nombre);
  if (!q) return undefined;
  return lugares.find((l) => normalizar(l.nombre) === q);
}

export function nombresOrdenados(lugares: Lugar[]): string[] {
  return lugares.map((l) => l.nombre).sort((a, b) => a.localeCompare(b));
}

export function rutaDe(bus: Bus, sentido: Sentido): string[] {
  return sentido === "ida" ? bus.ida : bus.vuelta;
}

export function nombresDe(lugares: Lugar[], ids: string[]): string[] {
  const mapa = new Map(lugares.map((l) => [l.id, l.nombre]));
  return ids.map((id) => mapa.get(id) || id);
}

export function cadenaTexto(nombres: string[]): string {
  return nombres.join(" ↔ ");
}

/** Segmento de la ruta desde A hasta B (incluidos) si en ese sentido el bus los recorre en orden. */
export function segmentoEntre(
  ruta: string[],
  desdeId: string,
  hastaId: string
): string[] | null {
  if (!desdeId || !hastaId || desdeId === hastaId) return null;
  const i = ruta.indexOf(desdeId);
  const j = ruta.indexOf(hastaId);
  if (i < 0 || j < 0 || i > j) return null;
  return ruta.slice(i, j + 1);
}

export interface OpcionViaje {
  bus: Bus;
  sentido: Sentido;
  segmento: string[];
}

/**
 * Buses que conectan A -> B: para cada bus revisa ida y vuelta y devuelve el
 * segmento de lugares por los que pasa para llegar del punto A al punto B.
 */
export function buscarViajes(buses: Bus[], desdeId: string, hastaId: string): OpcionViaje[] {
  const res: OpcionViaje[] = [];
  for (const bus of buses) {
    for (const sentido of ["ida", "vuelta"] as const) {
      const seg = segmentoEntre(rutaDe(bus, sentido), desdeId, hastaId);
      if (seg) res.push({ bus, sentido, segmento: seg });
    }
  }
  return res.sort((a, b) => a.bus.origen.localeCompare(b.bus.origen));
}

export function paradasIntermedias(segmento: string[]): number {
  return Math.max(0, segmento.length - 2);
}

/** URL de Google Maps (iframe, sin API key) con el recorrido de los lugares dados. */
export function urlGoogleMaps(nombres: string[]): string {
  const limpios = nombres.map((n) => n.trim()).filter(Boolean);
  if (limpios.length === 0) return "";
  if (limpios.length === 1) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(limpios[0])}&hl=es&output=embed`;
  }
  const ruta = limpios.map(encodeURIComponent).join("/");
  return `https://maps.google.com/maps/dir/${ruta}?hl=es&output=embed`;
}

export function hayInternet(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

/** Lugares usados por un bus en cualquiera de sus sentidos. */
export function lugaresDelBus(bus: Bus): number {
  return new Set([...bus.ida, ...bus.vuelta]).size;
}
