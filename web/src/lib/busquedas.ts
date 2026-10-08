export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function esNumeroPrecio(t: string): boolean {
  const n = parseFloat(t.replace(",", "."));
  return !isNaN(n) && n >= 0;
}

export function precioTexto(n: number): string {
  return "$" + n.toFixed(2);
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
