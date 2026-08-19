import type { Tema } from "../types";
import { COLOR_PRESETS } from "../types";

type RGB = [number, number, number];

export function esColorHex(s: string): boolean {
  return /^#[0-9a-fA-F]{3,8}$/.test(s.trim());
}

function hexARgb(hex: string): RGB {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (isNaN(n)) return [37, 99, 235];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mezclar(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function str(r: RGB): string {
  return `${r[0]} ${r[1]} ${r[2]}`;
}

export function acentoDe(color: string, tema: Tema): string {
  if (esColorHex(color)) return color.trim();
  const p = COLOR_PRESETS.find((c) => c.id === color);
  if (!p) return tema === "dark" ? "#60a5fa" : "#2563eb";
  return tema === "dark" ? p.dark : p.light;
}

/* Aplica el color elegido a TODA la app (fondo, tarjetas, acentos) */
export function aplicarPaleta(color: string, tema: Tema): void {
  const html = document.documentElement;
  const acc = hexARgb(acentoDe(color, tema));
  const oscuro = tema === "dark";

  const base = oscuro
    ? {
        fondo: [14, 18, 32] as RGB,
        card: [24, 30, 50] as RGB,
        soft: [33, 42, 66] as RGB,
        borde: [47, 58, 88] as RGB,
        tinta: [240, 244, 255] as RGB,
        subtinta: [160, 172, 198] as RGB,
        onacc: [10, 14, 26] as RGB,
        blanco: [255, 255, 255] as RGB,
      }
    : {
        fondo: [244, 246, 251] as RGB,
        card: [255, 255, 255] as RGB,
        soft: [235, 240, 250] as RGB,
        borde: [210, 220, 235] as RGB,
        tinta: [24, 32, 48] as RGB,
        subtinta: [90, 104, 128] as RGB,
        onacc: [255, 255, 255] as RGB,
        blanco: [255, 255, 255] as RGB,
      };

  const vars: Record<string, RGB> = {
    "--c-acc": acc,
    "--c-acc-fuerte": oscuro ? mezclar(acc, base.blanco, 0.28) : mezclar(acc, base.fondo, 0.32),
    "--c-acc-suave": oscuro ? mezclar(acc, base.card, 0.86) : mezclar(acc, base.blanco, 0.88),
    "--c-fondo": mezclar(base.fondo, acc, oscuro ? 0.1 : 0.06),
    "--c-card": base.card,
    "--c-soft": mezclar(base.soft, acc, oscuro ? 0.1 : 0.12),
    "--c-borde": mezclar(base.borde, acc, oscuro ? 0.13 : 0.17),
    "--c-tinta": base.tinta,
    "--c-subtinta": base.subtinta,
    "--c-onacc": base.onacc,
  };

  for (const [k, v] of Object.entries(vars)) html.style.setProperty(k, str(v));
}

export function colorTextoActivo(color: string, tema: Tema): string {
  return acentoDe(color, tema);
}
