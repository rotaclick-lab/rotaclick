"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Feedback } from "@/components/Feedback";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client";

type FormState = {
  full_name: string;
  email: string;
  password: string;
  error: string | null;
  success: string | null;
  isSubmitting: boolean;
};

function friendlyError(message?: string) {
  const m = (message ?? "").toLowerCase();
  if (!m) return "Não foi possível criar sua conta. Tente novamente.";
  if (m.includes("already registered") || m.includes("already") || m.includes("exists")) {
    return "Este e-mail já está cadastrado. Você pode entrar em /login.";
  }
  if (m.includes("password")) {
    return "Verifique a senha e tente novamente.";
  }
  if (m.includes("email")) {
    return "Verifique o e-mail informado e tente novamente.";
  }
  return "Não foi possível criar sua conta. Tente novamente.";
}

export function SignUpForm() {
  const [state, setState] = React.useState<FormState>({
    full_name: "",
    email: "",
    password: "",
    error: null,
    success: null,
    isSubmitting: false,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState((s) => ({ ...s, error: null, success: null, isSubmitting: true }));

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

      const redirectTo = `${window.location.origin}/auth/callback?next=/app/cotacoes`;

      const { error } = await supabase.auth.signUp({
        email: state.email.trim(),
        password: state.password,
        options: {
          emailRedirectTo: redirectTo,
          // metadata opcional (útil no futuro para preencher profiles)
          data: {
            full_name: state.full_name.trim() || undefined,
          },
        },
      });

      if (error) {
        setState((s) => ({
          ...s,
          error: friendlyError(error.message),
          isSubmitting: false,
        }));
        return;
      }

      setState((s) => ({
        ...s,
        success:
          "Conta criada. Enviamos um e-mail de confirmação — conclua a confirmação para entrar.",
        isSubmitting: false,
        password: "",
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? friendlyError(err.message) : friendlyError(),
        isSubmitting: false,
      }));
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Criar conta"
          subtitle="Use seu e-mail corporativo. Você vai confirmar o endereço por e-mail."
        />

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="full_name">
              Nome (opcional)
            </label>
            <Input
              id="full_name"
              name="full_name"
              value={state.full_name}
              onChange={(e) => setState((s) => ({ ...s, full_name: e.target.value }))}
              placeholder="Seu nome"
              autoComplete="name"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              E-mail
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={state.email}
              onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
              placeholder="voce@empresa.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Senha
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={state.password}
              onChange={(e) => setState((s) => ({ ...s, password: e.target.value }))}
              placeholder="Crie uma senha"
              autoComplete="new-password"
            />
          </div>

          {state.error ? <Feedback variant="error" title={state.error} /> : null}
          {state.success ? <Feedback variant="success" title={state.success} /> : null}

          <Button type="submit" className="w-full" disabled={state.isSubmitting}>
            {state.isSubmitting ? "Criando…" : "Criar conta"}
          </Button>

          <div className="text-center text-xs text-slate-500">
            Já tem conta?{" "}
            <Link href="/login" className="text-sky-700 hover:text-sky-800">
              Entrar
            </Link>
          </div>
        </form>
      </div>
    </Card>
  );
}
