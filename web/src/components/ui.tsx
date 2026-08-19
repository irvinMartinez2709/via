import { useEffect, useMemo, useRef, useState } from "react";
import { esNumeroPrecio, precioParse } from "../lib/busquedas";

export function Input({
  label,
  value,
  onChange,
  placeholder,
  tipo = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tipo?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-subtinta">{label}</span>
      <input
        type={tipo}
        inputMode={tipo === "tel" ? "decimal" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border-2 border-borde bg-soft px-4 py-3 text-tinta outline-none placeholder:text-subtinta/60 focus:border-acc"
      />
    </label>
  );
}

export function Emoji({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`emoji ${className || ""}`} aria-hidden="true">
      {children}
    </span>
  );
}

export function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition active:scale-95 ${
        activo
          ? "border-acc bg-acc text-onacc"
          : "border-borde bg-card text-subtinta"
      }`}
    >
      {children}
    </button>
  );
}

export function BotonVacio({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border-2 border-dashed border-borde bg-card px-4 py-3 text-sm font-semibold text-subtinta active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

export function Tarjeta({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-borde bg-card p-4">{children}</div>
  );
}

/* Selector desplegable propio (sin usar <select> nativo de Android) */
export function Selector({
  valor,
  opciones,
  alElegir,
  placeholder,
  label,
  mostrar,
}: {
  valor: string;
  opciones: { id: string; texto: string; detalle?: string }[];
  alElegir: (id: string) => void;
  placeholder?: string;
  label?: string;
  mostrar?: (id: string) => string;
}) {
  const [abierto, setAbierto] = useState(false);
  const seleccionada = opciones.find((o) => o.id === valor);
  const texto = seleccionada
    ? mostrar
      ? mostrar(seleccionada.id)
      : seleccionada.texto
    : placeholder || "Selecciona…";

  return (
    <div>
      {label && (
        <span className="mb-1 block text-sm font-semibold text-subtinta">{label}</span>
      )}
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border-2 border-borde bg-soft px-4 py-3 text-left text-tinta outline-none active:scale-[0.99]"
      >
        <span className={seleccionada ? "font-medium" : "text-subtinta"}>{texto}</span>
        <span className="text-xs text-subtinta">▾</span>
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={() => setAbierto(false)}
        >
          <div
            className="max-h-[70vh] w-full max-w-md animate-pop rounded-t-3xl border-2 border-borde bg-card p-4 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold text-tinta">{label || "Selecciona"}</h3>
              <button
                onClick={() => setAbierto(false)}
                className="rounded-xl bg-soft px-3 py-1.5 font-bold text-subtinta"
              >
                ✕
              </button>
            </div>
            <div className="smooth-scroll max-h-[52vh]">
              <button
                onClick={() => {
                  alElegir("");
                  setAbierto(false);
                }}
                className={`mb-1 w-full rounded-2xl px-4 py-3 text-left font-medium ${
                  valor === "" ? "bg-acc-suave text-acc" : "bg-soft text-subtinta"
                }`}
              >
                {placeholder || "Ninguno"}
              </button>
              {opciones.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    alElegir(o.id);
                    setAbierto(false);
                  }}
                  className={`mb-1 w-full rounded-2xl px-4 py-3 text-left ${
                    o.id === valor ? "bg-acc text-onacc" : "bg-soft text-tinta"
                  }`}
                >
                  <span className="font-semibold">{o.texto}</span>
                  {o.detalle && (
                    <span
                      className={`ml-2 text-xs ${
                        o.id === valor ? "text-onacc/70" : "text-subtinta"
                      }`}
                    >
                      {o.detalle}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Stepper interactivo para tiempos (minutos) con botones − / + y pulsación mantenida */
export function Stepper({
  valor,
  alCambiar,
  min,
  max,
  paso = 1,
  formato,
  sufijo,
}: {
  valor: number;
  alCambiar: (v: number) => void;
  min: number;
  max: number;
  paso?: number;
  formato?: (v: number) => string;
  sufijo?: string;
}) {
  const refTemporizador = useRef<number | null>(null);
  const refIntervalo = useRef<number | null>(null);

  function aplicar(delta: number) {
    const n = Math.min(max, Math.max(min, Math.round((valor + delta) / paso) * paso));
    alCambiar(n);
  }

  function iniciar(delta: number) {
    aplicar(delta);
    refTemporizador.current = window.setTimeout(() => {
      refIntervalo.current = window.setInterval(() => aplicar(delta), 110);
    }, 400);
  }

  function detener() {
    if (refTemporizador.current) clearTimeout(refTemporizador.current);
    if (refIntervalo.current) clearInterval(refIntervalo.current);
    refTemporizador.current = null;
    refIntervalo.current = null;
  }

  useEffect(() => () => detener(), []);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={valor <= min}
        onPointerDown={() => iniciar(-paso)}
        onPointerUp={detener}
        onPointerLeave={detener}
        onPointerCancel={detener}
        className="h-11 w-11 select-none rounded-xl border-2 border-borde bg-soft text-lg font-bold text-acc disabled:opacity-30 active:scale-95"
      >
        −
      </button>
      <span className="min-w-[52px] text-center text-lg font-extrabold text-tinta">
        {formato ? formato(valor) : valor}
        {sufijo ? <span className="ml-1 text-xs font-semibold text-subtinta">{sufijo}</span> : null}
      </span>
      <button
        type="button"
        disabled={valor >= max}
        onPointerDown={() => iniciar(paso)}
        onPointerUp={detener}
        onPointerLeave={detener}
        onPointerCancel={detener}
        className="h-11 w-11 select-none rounded-xl border-2 border-borde bg-soft text-lg font-bold text-acc disabled:opacity-30 active:scale-95"
      >
        +
      </button>
    </div>
  );
}

/* Campo con autocompletar: escribe o elige de la lista */
export function Combo({
  label,
  valor,
  alCambiar,
  opciones,
  placeholder,
  alElegir,
}: {
  label?: string;
  valor: string;
  alCambiar: (v: string) => void;
  opciones: string[];
  placeholder?: string;
  alElegir?: (v: string) => void;
}) {
  const [foco, setFoco] = useState(false);
  const q = useMemo(() => valor.trim().toLowerCase(), [valor]);
  const sugerencias = useMemo(() => {
    if (!q) return opciones.slice(0, 6);
    return opciones
      .filter((o) => o.toLowerCase().includes(q))
      .slice(0, 6);
  }, [opciones, q]);

  return (
    <div className="relative">
      {label && (
        <span className="mb-1 block text-sm font-semibold text-subtinta">{label}</span>
      )}
      <input
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        onFocus={() => setFoco(true)}
        onBlur={() => setTimeout(() => setFoco(false), 200)}
        placeholder={placeholder}
        className="w-full rounded-2xl border-2 border-borde bg-soft px-4 py-3 text-tinta outline-none placeholder:text-subtinta/60 focus:border-acc"
      />
      {foco && sugerencias.length > 0 && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border-2 border-borde bg-card shadow-xl">
          {sugerencias.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => {
                alCambiar(s);
                alElegir?.(s);
              }}
              className="block w-full px-4 py-2.5 text-left text-sm font-medium text-tinta hover:bg-soft active:bg-soft"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Entrada de precio con escritura libre (permite el punto decimal sin cortarse) */
export function TarifaInput({
  valor,
  alCambiar,
  placeholder,
}: {
  valor: number | null;
  alCambiar: (precio: number | null, texto: string) => void;
  placeholder?: string;
}) {
  const [texto, setTexto] = useState(valor === null ? "" : valor.toFixed(2));
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (!editando) setTexto(valor === null ? "" : valor.toFixed(2));
  }, [valor, editando]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={texto}
      placeholder={placeholder}
      onChange={(e) => {
        const t = e.target.value;
        setTexto(t);
        if (t.trim() === "") alCambiar(null, t);
        else if (esNumeroPrecio(t)) alCambiar(precioParse(t), t);
      }}
      onFocus={() => setEditando(true)}
      onBlur={() => setEditando(false)}
      className="w-full rounded-2xl border-2 border-borde bg-soft px-4 py-2.5 text-center text-tinta outline-none placeholder:text-subtinta/60 focus:border-acc"
    />
  );
}