export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function limpiarHora(h: string): string {
  return (h || "").trim().replace(/[^0-9:]/g, "");
}

export function esHoraValida(h: string): boolean {
  const m = limpiarHora(h).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return false;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

export function horaAMinutos(h: string): number {
  const m = limpiarHora(h).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function minutosAHora(min: number): string {
  let total = ((Math.round(min) % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function horaActualMin(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function horaTexto(h: string): string {
  const m = limpiarHora(h).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return h;
  let hh = parseInt(m[1], 10);
  const mm = m[2];
  const suf = hh >= 12 ? "p. m." : "a. m.";
  hh = hh % 12 === 0 ? 12 : hh % 12;
  return `${hh}:${mm} ${suf}`;
}

export function ordenarHoras(horas: string[]): string[] {
  return [...new Set(horas)]
    .filter(esHoraValida)
    .sort((a, b) => horaAMinutos(a) - horaAMinutos(b));
}

export function esNumeroPrecio(t: string): boolean {
  const n = parseFloat(t.replace(",", "."));
  return !isNaN(n) && n >= 0;
}

export function precioTexto(n: number): string {
  return "$" + n.toFixed(2).replace(".", ".");
}

export function precioParse(t: string): number {
  const n = parseFloat(t.replace(",", "."));
  return isNaN(n) ? NaN : Math.round(n * 100) / 100;
}

function iniciosDe(norm: string): string[] {
  const partes = norm.split(/\s+/).filter(Boolean);
  const inicios: string[] = [];
  for (const p of partes) {
    for (let i = 1; i <= p.length; i++) inicios.push(p.slice(0, i));
  }
  return inicios;
}

export function puntuarCoincidencia(texto: string, q: string): number {
  const t = normalizar(texto);
  const query = normalizar(q);
  if (!query) return 0;
  if (t === query) return 100;
  if (t.startsWith(query)) return 90;
  if (t.includes(query)) return 80;
  const queryParts = query.split(/\s+/).filter(Boolean);
  if (queryParts.length > 1 && queryParts.every((p) => t.includes(p))) return 75;
  const p = t.split(/\s+/);
  if (p.some((palabra) => palabra.startsWith(query))) return 70;
  if (iniciosDe(t).includes(query)) return 65;
  return 0;
}

export function difLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let anterior = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const actual = [i];
    for (let j = 1; j <= n; j++) {
      actual[j] = Math.min(
        anterior[j] + 1,
        actual[j - 1] + 1,
        anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    anterior = actual;
  }
  return anterior[n];
}

export function coincideFuzzy(texto: string, q: string): boolean {
  const t = normalizar(texto);
  const query = normalizar(q);
  if (!query) return true;
  if (puntuarCoincidencia(t, query) > 0) return true;
  const qPartes = query.split(/\s+/).filter(Boolean);
  const tPartes = t.split(/\s+/).filter(Boolean);
  const umbral = Math.max(1, Math.floor(query.length / 3));
  return qPartes.some(
    (qp) =>
      tPartes.some((tp) => difLevenshtein(tp, qp) <= umbral) ||
      (qp.length >= 3 &&
        tPartes.some((tp) => difLevenshtein(tp, qp.slice(0, qp.length - 1)) <= umbral))
  );
}
