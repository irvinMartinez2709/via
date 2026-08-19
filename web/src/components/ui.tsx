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
