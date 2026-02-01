"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client";

type FormState = {
  email: string;
  password: string;
  error: string | null;
  isSubmitting: boolean;
};

function friendlyError(message?: string) {
  const m = (message ?? "").toLowerCase();

  if (!m) return "Não foi possível entrar. Tente novamente.";
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "E-mail ou senha inválidos.";
  }
  if (m.includes("email")) {
    return "Verifique o e-mail informado e tente novamente.";
  }

  return "Não foi possível entrar. Tente novamente.";
}

export function LoginForm() {
  const router = useRouter();
  const [state, setState] = React.useState<FormState>({
    email: "",
    password: "",
    error: null,
    isSubmitting: false,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setState((s) => ({ ...s, error: null, isSubmitting: true }));

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setState((s) => ({
          ...s,
          error:
            "Configuração do Supabase ausente. Defina as variáveis em .env.local e recarregue a página.",
          isSubmitting: false,
        }));
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: state.email.trim(),
        password: state.password,
      });

      if (error) {
        setState((s) => ({
          ...s,
          error: friendlyError(error.message),
          isSubmitting: false,
        }));
        return;
      }

      router.replace("/app");
      router.refresh();
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? friendlyError(err.message) : friendlyError(),
        isSubmitting: false,
      }));
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-brand-secondary">
            Acesse o RotaClick
          </h1>
          <p className="text-sm text-slate-600">
            Use seu e-mail e senha cadastrados no Supabase.
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              E-mail
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={state.email}
              onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
              placeholder="voce@empresa.com"
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="password"
            >
              Senha
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={state.password}
              onChange={(e) =>
                setState((s) => ({ ...s, password: e.target.value }))
              }
              placeholder="Sua senha"
            />
          </div>

          {state.error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {state.error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-black/90 focus-visible:ring-black"
            disabled={state.isSubmitting}
          >
            {state.isSubmitting ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </Card>
  );
}
