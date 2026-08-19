import type { Bus } from "../types";
import { puntuar } from "./busquedaBus";

export function coincidenBuses(buses: Bus[], q: string): Bus[] {
  return buses
    .map((b) => ({ b, p: puntuar(b, q) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p)
    .map((x) => x.b);
}
