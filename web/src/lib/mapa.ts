import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { guardarMbtiles, leerMbtiles, borrarMbtiles } from "./idb";

export interface InfoMapa {
  nombre: string;
  tiles: number;
  minzoom: number;
  maxzoom: number;
}

interface MapaCargado {
  tiles: Map<string, string>;
  info: InfoMapa;
}

export const URL_VACIA =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

let estado: MapaCargado | null = null;
let promesaSql: ReturnType<typeof initSqlJs> | null = null;

function sql() {
  if (!promesaSql) promesaSql = initSqlJs({ locateFile: () => wasmUrl });
  return promesaSql;
}

async function parsear(buf: ArrayBuffer): Promise<MapaCargado> {
  const SQL = await sql();
  const db = new SQL.Database(new Uint8Array(buf));
  const meta: Record<string, string> = {};
  try {
    const m = db.exec("SELECT name, value FROM metadata");
    if (m.length && m[0].values) {
      for (const fila of m[0].values as unknown[][]) {
        meta[String(fila[0])] = String(fila[1]);
      }
    }
  } catch {
    /* sin metadatos */
  }
  const tiles = new Map<string, string>();
  let minzoom = Infinity;
  let maxzoom = -Infinity;
  try {
    const t = db.exec("SELECT zoom_level, tile_column, tile_row, tile_data FROM tiles");
    if (t.length) {
      for (const fila of t[0].values as unknown[][]) {
        const z = fila[0] as number;
        const x = fila[1] as number;
        const row = fila[2] as number;
        const data = fila[3] as Uint8Array;
        const y = Math.pow(2, z) - 1 - row;
        const blob = new Blob([data as unknown as BlobPart], { type: "image/png" });
        tiles.set(`${z}/${x}/${y}`, URL.createObjectURL(blob));
        if (z < minzoom) minzoom = z;
        if (z > maxzoom) maxzoom = z;
      }
    }
  } catch {
    /* sin mosaicos */
  }
  db.close();
  return {
    tiles,
    info: {
      nombre: meta.name || "Mapa sin nombre",
      tiles: tiles.size,
      minzoom: minzoom === Infinity ? 0 : minzoom,
      maxzoom: maxzoom === -Infinity ? 19 : maxzoom,
    },
  };
}

export async function cargarMapa(): Promise<MapaCargado | null> {
  if (estado) return estado;
  const buf = await leerMbtiles();
  if (!buf) return null;
  estado = await parsear(buf);
  return estado;
}

export async function importarMapa(buf: ArrayBuffer): Promise<InfoMapa> {
  const r = await parsear(buf);
  await guardarMbtiles(buf);
  if (estado) {
    for (const url of estado.tiles.values()) URL.revokeObjectURL(url);
  }
  estado = r;
  return r.info;
}

export async function quitarMapa(): Promise<void> {
  await borrarMbtiles();
  if (estado) {
    for (const url of estado.tiles.values()) URL.revokeObjectURL(url);
  }
  estado = null;
}

export function infoMapaActual(): InfoMapa | null {
  return estado?.info ?? null;
}
