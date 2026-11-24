import type { Livestock } from "./types";

export function displayName(l: Pick<Livestock, "id" | "name">) {
  return l.name ? `${l.name} (${l.id})` : l.id;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const SEX_LABEL = { J: "Jantan", B: "Betina" } as const;
