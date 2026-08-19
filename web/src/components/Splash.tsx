import { useEffect, useState } from "react";

export default function Splash({ onDone }: { onDone: () => void }) {
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setOculto(true);
      const t2 = setTimeout(onDone, 400);
      return () => clearTimeout(t2);
    }, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  if (oculto) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-fondo px-8">
      <img
        src="/imagenes/splash.png"
        alt="Via"
        className="mb-6 h-44 w-auto max-w-[80vw] animate-float object-contain"
      />
      <h1 className="text-4xl font-extrabold tracking-tight text-acc animate-pop">Via</h1>
      <p className="mt-2 text-sm text-subtinta">Tu guía de transporte</p>
      <div className="mt-8 flex items-center gap-2">
        <span className="h-2 w-2 animate-bounce rounded-full bg-acc" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-acc [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-acc [animation-delay:300ms]" />
      </div>
    </div>
  );
}
