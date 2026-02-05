import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sem envs, não tem como trocar o code por session.
  if (!url || !anonKey) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (errorDescription) {
    const target = new URL("/auth/auth-code-error", request.url);
    target.searchParams.set("message", errorDescription);
    return NextResponse.redirect(target);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Importante: usar cookies do Next (Route Handler) e repassar get/set/remove
  // para o cliente do Supabase. Assim a session é persistida no browser.
  const cookieStore = await cookies();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const target = new URL("/auth/auth-code-error", request.url);
    target.searchParams.set("message", error.message);
    return NextResponse.redirect(target);
  }

  // Se houve um "next=..." no redirect, respeitar. (Opcional mas útil.)
  const next = requestUrl.searchParams.get("next");
  const safeNext = next?.startsWith("/") ? next : "/app/cotacoes";

  return NextResponse.redirect(new URL(safeNext, request.url));
}
