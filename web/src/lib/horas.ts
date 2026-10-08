import type { FormatoHora, Llegada, Salida, Sentido } from "../types";

export function esHoraValida(h: string): boolean {
  const m = (h || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return false;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

export function horaTexto(h: string, formato: FormatoHora): string {
  if (!esHoraValida(h)) return "—";
  const [hs, ms] = h.split(":");
  const hh = parseInt(hs, 10);
  if (formato === "24") return `${String(hh).padStart(2, "0")}:${ms}`;
  const suf = hh >= 12 ? "p. m." : "a. m.";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${ms} ${suf}`;
}

export function horaAMinutos(h: string): number {
  const m = (h || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return -1;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function horaAhora(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Llegadas de una salida en el orden de la ruta (con "—" para las que no tengan hora). */
export function llegadasOrdenadas(salida: Salida, ruta: string[]): Llegada[] {
  const mapa = new Map(salida.llegadas.map((l) => [l.lugarId, l.hora]));
  return ruta.map((lugarId) => ({ lugarId, hora: mapa.get(lugarId) ?? "" }));
}

/** Hora en la que el bus sale (pasa por el primer nodo de la ruta). */
export function horaSalida(salida: Salida, ruta: string[]): string {
  const primera = ruta[0];
  if (!primera) return "";
  return salida.llegadas.find((l) => l.lugarId === primera)?.hora || "";
}

export function ordenarSalidas(salidas: Salida[], ruta: string[]): Salida[] {
  return [...salidas].sort(
    (a, b) => horaAMinutos(horaSalida(a, ruta)) - horaAMinutos(horaSalida(b, ruta))
  );
}

/** Reconstruye las llegadas respetando el orden actual de la ruta. */
export function alinearLlegadas(
  llegadas: Llegada[],
  ruta: string[]
): { lugarId: string; hora: string }[] {
  const mapa = new Map(llegadas.map((l) => [l.lugarId, l.hora]));
  return ruta.map((lugarId) => ({
    lugarId,
    hora: mapa.get(lugarId) ?? "",
  }));
}

export function salidasDe(bus: { horarios: { ida: Salida[]; vuelta: Salida[] } }, sentido: Sentido): Salida[] {
  return sentido === "ida" ? bus.horarios.ida : bus.horarios.vuelta;
}
