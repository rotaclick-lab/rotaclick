"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Feedback } from "@/components/Feedback";
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
    <Card className="mx-auto w-full max-w-md border-slate-200/80 bg-white/80 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Acesse o RotaClick"
          subtitle="Use seu e-mail e senha cadastrados no Supabase."
        />

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

          {state.error ? <Feedback variant="error" title={state.error} /> : null}

          <Button
            type="submit"
            className="w-full"
            disabled={state.isSubmitting}
          >
            {state.isSubmitting ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </Card>
  );
}
