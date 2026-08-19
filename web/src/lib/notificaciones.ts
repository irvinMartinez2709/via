import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Bus, Parada, SeleccionDia } from "../types";

export function esNativo(): boolean {
  return Capacitor.isNativePlatform();
}

export function notificacionesDisponibles(): boolean {
  return esNativo();
}

export async function pedirPermisoNotificaciones(): Promise<boolean> {
  if (!esNativo()) return false;
  try {
    const p = await LocalNotifications.checkPermissions();
    if (p.display === "granted") return true;
    const r = await LocalNotifications.requestPermissions();
    return r.display === "granted";
  } catch {
    return false;
  }
}

function minutoAbs(fecha: string, hora: string): Date | null {
  const m = hora.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [y, mo, d] = fecha.split("-").map(Number);
  const dt = new Date(y, (mo || 1) - 1, d || 1, parseInt(m[1], 10), parseInt(m[2], 10));
  return isNaN(dt.getTime()) ? null : dt;
}

function paradaMinutos(bus: Bus, paradaId: string): number {
  const p = bus.paradas.find((x) => x.id === paradaId);
  return p ? p.minutos : 0;
}

function paradaDesfase(bus: Bus, paradaId: string): number {
  const p = bus.paradas.find((x) => x.id === paradaId);
  return p ? p.desfase ?? 0 : 0;
}

export function calcularHoraPaso(
  bus: Bus,
  direccion: "ida" | "vuelta",
  horaSalida: string,
  paradaId: string
): string {
  const mMi = horaAMinutos(horaSalida);
  const total = bus.paradas.length
    ? Math.max(...bus.paradas.map((p) => p.minutos))
    : 0;
  const pMin = paradaMinutos(bus, paradaId);
  const desfase = paradaDesfase(bus, paradaId);
  const offset = direccion === "ida" ? pMin : total - pMin;
  return minutosAHora(mMi + offset + desfase);
}

function horaAMinutos(h: string): number {
  const m = h.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function minutosAHora(min: number): string {
  let total = ((Math.round(min) % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function paradasDeBus(bus: Bus): Parada[] {
  return [...bus.paradas].sort((a, b) => a.minutos - b.minutos);
}

export function buscarParada(bus: Bus, id: string): Parada | undefined {
  return bus.paradas.find((p) => p.id === id);
}

export interface Recordatorio {
  id: string;
  fecha: Date;
  titulo: string;
  cuerpo: string;
  minutosAntes: number;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function construirRecordatorios(
  sel: SeleccionDia,
  bus: Bus,
  paradaNombre: string
): Recordatorio[] {
  const horaPaso = calcularHoraPaso(bus, sel.direccion, sel.hora, sel.paradaSubidaId);
  const base = minutoAbs(sel.fecha, horaPaso);
  if (!base) return [];
  const lista: Recordatorio[] = [];
  const minutos = new Set<number>();
  minutos.add(10);
  if (sel.recordatorioMin > 0) minutos.add(sel.recordatorioMin);
  for (const m of minutos) {
    const f = new Date(base.getTime() - m * 60 * 1000);
    lista.push({
      id: `rec-${sel.id}-${m}`,
      fecha: f,
      minutosAntes: m,
      titulo: `Bus ${bus.nombre}`,
      cuerpo: `Pasa por ${paradaNombre} a las ${horaTexto(horaPaso)}. Te lo recordamos ${m} min antes.`,
    });
  }
  lista.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  return lista;
}

function horaTexto(h: string): string {
  const m = h.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return h;
  let hh = parseInt(m[1], 10);
  const mm = m[2];
  const suf = hh >= 12 ? "p. m." : "a. m.";
  hh = hh % 12 === 0 ? 12 : hh % 12;
  return `${hh}:${mm} ${suf}`;
}

export async function programarRecordatorios(
  sel: SeleccionDia,
  bus: Bus,
  paradaNombre: string
): Promise<void> {
  if (!notificacionesDisponibles()) return;
  const lista = construirRecordatorios(sel, bus, paradaNombre);
  for (const r of lista) {
    if (r.fecha.getTime() <= Date.now()) continue;
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: hash(r.id) % 2147483647,
            title: r.titulo,
            body: r.cuerpo,
            schedule: { at: r.fecha },
          },
        ],
      });
    } catch {
      /* si falla uno, se intenta el siguiente */
    }
  }
}

export function idsRecordatorio(selId: string, minutos: number[]): number[] {
  const ids: number[] = [];
  const mins = new Set<number>([10, ...minutos].filter((m) => m > 0));
  for (const m of mins) {
    ids.push((hash(`rec-${selId}-${m}`) % 2147483647));
  }
  return ids;
}

export async function cancelarRecordatorios(selId: string, minutos: number[]): Promise<void> {
  if (!notificacionesDisponibles()) return;
  try {
    const ids = idsRecordatorio(selId, minutos);
    const pendientes = await LocalNotifications.getPending();
    const coinciden = pendientes.notifications.filter((n) =>
      ids.includes(n.id ?? -1)
    );
    for (const n of coinciden) {
      if (n.id != null)
        await LocalNotifications.cancel({ notifications: [{ id: n.id }] });
    }
  } catch {
    /* noop */
  }
}

export async function cancelarTodos(): Promise<void> {
  if (!notificacionesDisponibles()) return;
  try {
    const pendientes = await LocalNotifications.getPending();
    for (const n of pendientes.notifications) {
      if (n.id != null)
        await LocalNotifications.cancel({ notifications: [{ id: n.id }] });
    }
  } catch {
    /* noop */
  }
}

export { horaAMinutos, minutosAHora };
