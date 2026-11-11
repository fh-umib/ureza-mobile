import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import type * as Supabase from "./hyrja";
import * as offline from "./hyrja-offline";

const burimi: typeof Supabase =
  process.env.EXPO_PUBLIC_OFFLINE === "1"
    ? (offline satisfies typeof Supabase)
    : require("./hyrja");

export type { Perdoruesi } from "./hyrja";
export const { hyr, krijoLlogari, dil } = burimi;

type Sesioni = { perdoruesi: Supabase.Perdoruesi | null; dukeLexuar: boolean };

const SesioniContext = createContext<Sesioni>({ perdoruesi: null, dukeLexuar: true });

export function SesioniProvider({ children }: { children: ReactNode }) {
  const [sesioni, setSesioni] = useState<Sesioni>({ perdoruesi: null, dukeLexuar: true });

  useEffect(() => burimi.degjoSesionin((perdoruesi) => setSesioni({ perdoruesi, dukeLexuar: false })), []);

  return <SesioniContext.Provider value={sesioni}>{children}</SesioniContext.Provider>;
}

export function useSesioni(): Sesioni {
  return useContext(SesioniContext);
}
