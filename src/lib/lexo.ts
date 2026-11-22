// One query to Supabase, classified by what happened (used by dhenat.tsx and profili.tsx).

export type Pergjigje = PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }>;

export type Lexim<T> =
  | { tipi: "ok"; data: T }
  | { tipi: "mungon"; kodi?: string; mesazhi?: string } // the table (or a column) is not ready, e.g. a SQL file was not run yet
  | { tipi: "pa_lidhje" }; // the request never reached the server

export const PA_LIDHJE = "Nuk u lidh me serverin. Kontrollo internetin dhe provo përsëri.";

// Says what happened: it worked, the table is not ready, or there is no network
// (an error without a code means the request never got an answer).
export async function lexo<T>(kerkesa: Pergjigje): Promise<Lexim<T>> {
  try {
    const { data, error } = await kerkesa;
    if (error && !error.code) return { tipi: "pa_lidhje" };
    if (error) return { tipi: "mungon", kodi: error.code, mesazhi: error.message };
    if (data === null || data === undefined) return { tipi: "mungon" };
    return { tipi: "ok", data: data as T };
  } catch {
    return { tipi: "pa_lidhje" };
  }
}
