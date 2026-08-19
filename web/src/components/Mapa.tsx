import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cargarMapa, URL_VACIA, type InfoMapa } from "../lib/mapa";

const CENTRO: L.LatLngExpression = [8.43, -82.43];

export default function Mapa() {
  const refContenedor = useRef<HTMLDivElement>(null);
  const refMapa = useRef<L.Map | null>(null);
  const refCapa = useRef<L.GridLayer | null>(null);
  const [info, setInfo] = useState<InfoMapa | null>(null);

  function capaOffline(tiles: Map<string, string>): L.GridLayer {
    const Offline = L.GridLayer.extend({
      createTile: (coords: L.Coords) => {
        const img = document.createElement("img");
        img.src = tiles.get(`${coords.z}/${coords.x}/${coords.y}`) || URL_VACIA;
        return img;
      },
    });
    return new Offline();
  }

  useEffect(() => {
    const contenedor = refContenedor.current;
    if (!contenedor) return;
    const mapa = L.map(contenedor, {
      center: CENTRO,
      zoom: 11,
      attributionControl: false,
    });
    refMapa.current = mapa;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(mapa);

    let activo = true;
    void cargarMapa().then((r) => {
      if (!activo || !r || r.tiles.size === 0) return;
      setInfo(r.info);
      const capa = capaOffline(r.tiles);
      capa.addTo(mapa);
      refCapa.current = capa;
    });

    return () => {
      activo = false;
      mapa.remove();
      refMapa.current = null;
      refCapa.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refrescar() {
    const mapa = refMapa.current;
    if (!mapa) return;
    if (refCapa.current) {
      mapa.removeLayer(refCapa.current);
      refCapa.current = null;
    }
    setInfo(null);
    const r = await cargarMapa();
    if (!r || r.tiles.size === 0) return;
    setInfo(r.info);
    const capa = capaOffline(r.tiles);
    capa.addTo(mapa);
    refCapa.current = capa;
  }

  useEffect(() => {
    const alActualizar = () => void refrescar();
    window.addEventListener("via:mapa", alActualizar);
    return () => window.removeEventListener("via:mapa", alActualizar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="animate-fade-in flex flex-col gap-3">
      <h2 className="text-xl font-bold text-tinta">Mapa de Chiriquí</h2>
      {info && (
        <p className="rounded-xl bg-acc-suave px-3 py-2 text-xs font-semibold text-acc">
          Mapa sin internet activo: {info.nombre} ({info.tiles} mosaicos)
        </p>
      )}
      <div
        ref={refContenedor}
        className="h-[70vh] w-full overflow-hidden rounded-3xl border-2 border-borde"
      />
      <p className="text-xs text-subtinta">
        Con internet se muestra el mapa de OpenStreetMap. Para usarlo sin internet,
        descarga un archivo <b>.mbtiles</b> de Chiriquí y actívalo en "Más".
      </p>
    </div>
  );
}
