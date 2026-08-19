import type { Bus } from "../types";
import { normalizar, coincideFuzzy } from "./busquedas";

export function puntuar(bus: Bus, q: string): number {
  const query = normalizar(q);
  if (!query) return 0;
  let puntos = 0;

  const nombre = normalizar(bus.nombre);
  if (nombre === query) puntos += 100;
  else if (nombre.startsWith(query)) puntos += 90;
  else if (nombre.includes(query)) puntos += 80;
  else if (coincideFuzzy(bus.nombre, q)) puntos += 50;

  const ppal = normalizar(bus.lugarPrincipal);
  if (ppal && (ppal === query || ppal.includes(query) || coincideFuzzy(ppal, q)))
    puntos += 40;

  for (const p of bus.paradas) {
    const pn = normalizar(p.nombre);
    if (pn === query) puntos += 60;
    else if (pn.includes(query) || coincideFuzzy(p.nombre, q)) puntos += 30;
  }

  for (const t of bus.tarifas) {
    const desde = bus.paradas.find((p) => p.id === t.desdeId)?.nombre || "";
    const hasta = bus.paradas.find((p) => p.id === t.hastaId)?.nombre || "";
    const precio = String(t.precio);
    if (precio.replace(".", ",") === query || precio === query) puntos += 35;
    if (normalizar(desde + " " + hasta).includes(query)) puntos += 25;
  }

  return puntos;
}

export function coincidenParadas(bus: Bus, q: string): boolean {
  const query = normalizar(q);
  if (!query) return false;
  return bus.paradas.some((p) => {
    const n = normalizar(p.nombre);
    return n.includes(query) || coincideFuzzy(p.nombre, q);
  });
}

export function coincidenBus(bus: Bus, q: string): number {
  return puntuar(bus, q);
}
