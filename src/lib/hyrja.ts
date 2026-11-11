import type { Session } from "@supabase/supabase-js";

import { supabase } from "./supabase";

export type Perdoruesi = { id: string; email: string };

function ngaSesioni(sesioni: Session | null): Perdoruesi | null {
  return sesioni ? { id: sesioni.user.id, email: sesioni.user.email ?? "" } : null;
}

export async function hyr(email: string, fjalekalimi: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password: fjalekalimi });
  if (error) throw new Error(error.message);
}

export async function krijoLlogari(email: string, fjalekalimi: string): Promise<"hyri" | "konfirmo"> {
  const { data, error } = await supabase.auth.signUp({ email, password: fjalekalimi });
  if (error) throw new Error(error.message);
  return data.session ? "hyri" : "konfirmo";
}

export async function dil(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export function degjoSesionin(ndryshoi: (p: Perdoruesi | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_ngjarja, sesioni) => {
    ndryshoi(ngaSesioni(sesioni));
  });
  return () => data.subscription.unsubscribe();
}
