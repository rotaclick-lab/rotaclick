import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

export default function Home() {
  return (
    <div className="relative">
      {/* Background suave (sem imagens, só gradientes) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-44 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="absolute -top-28 right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-indigo-200/60 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[-6rem] h-[26rem] w-[26rem] rounded-full bg-emerald-200/40 blur-3xl" />
      </div>

      <div className="space-y-14">
        {/* HERO */}
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-600 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Plataforma B2B • múltiplas propostas • decisão com 1 clique
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Cotação de frete B2B com cara de produto —
              <span className="block bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                rápido, claro e rastreável.
              </span>
            </h1>

            <p className="text-base leading-relaxed text-slate-700 sm:text-lg">
              O <span className="font-semibold text-slate-900">RotaClick</span> organiza solicitações,
              propostas e decisão final em um fluxo simples — sem virar leilão.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/login">
                <Button>Entrar</Button>
              </Link>
              <div className="text-sm text-slate-500">
                Acesso controlado por empresa. Sem cadastro público nesta etapa.
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white/70 p-3 shadow-sm backdrop-blur">
                <div className="text-xs font-semibold text-slate-500">Tempo</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Menos idas e vindas</div>
                <div className="mt-1 text-xs text-slate-600">Tudo no mesmo lugar.</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/70 p-3 shadow-sm backdrop-blur">
                <div className="text-xs font-semibold text-slate-500">Clareza</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Compare lado a lado</div>
                <div className="mt-1 text-xs text-slate-600">Preço, prazo e status.</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/70 p-3 shadow-sm backdrop-blur">
                <div className="text-xs font-semibold text-slate-500">Governança</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Decisão registrada</div>
                <div className="mt-1 text-xs text-slate-600">Quem escolheu e quando.</div>
              </div>
            </div>
          </div>

          {/* Mock UI (só HTML/CSS, sem libs e sem imagens) */}
          <div className="relative">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-600 to-indigo-600" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">RotaClick</div>
                    <div className="text-xs text-slate-500">Painel</div>
                  </div>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                  Status: <span className="font-semibold text-emerald-700">OPEN</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">São Paulo/SP → Rio de Janeiro/RJ</div>
                      <div className="mt-1 text-xs text-slate-600">Carga: Paletizada • Coleta: 12/02</div>
                    </div>
                    <div className="text-xs text-slate-500">há 2h</div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-500">Propostas</div>
                  <div className="mt-3 grid gap-2">
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">TransLog</div>
                        <div className="text-xs text-slate-500">Prazo: 3 dias</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">R$ 2.450</div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">RotaSul</div>
                        <div className="text-xs text-slate-500">Prazo: 4 dias</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">R$ 2.190</div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">CargaCerta</div>
                        <div className="text-xs text-emerald-800">Vencedora • Prazo: 3 dias</div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-900">R$ 2.280</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-slate-500">Escolha registrada • RLS ativo</div>
                    <div className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-sm">
                      Escolher proposta
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Feito para operação e comercial
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Um fluxo claro para solicitar, comparar e decidir — com histórico.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-10 w-10 rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-200">
                  <div className="grid h-full place-items-center text-sm font-semibold">1</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Solicitação estruturada</div>
                  <p className="mt-1 text-sm text-slate-600">
                    Origem/destino, carga e coleta com campos objetivos.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                  <div className="grid h-full place-items-center text-sm font-semibold">2</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Propostas padronizadas</div>
                  <p className="mt-1 text-sm text-slate-600">
                    Preço e prazo comparáveis. Sem bagunça no WhatsApp.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  <div className="grid h-full place-items-center text-sm font-semibold">3</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Escolha com bloqueio</div>
                  <p className="mt-1 text-sm text-slate-600">
                    Ao escolher, fecha e evita novas propostas automaticamente.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Como funciona</h2>
              <p className="mt-2 text-sm text-slate-600">
                Um processo simples, com status visível e responsabilidades claras.
              </p>
              <div className="mt-5 space-y-3">
                <div className="flex gap-3">
                  <div className="mt-0.5 h-7 w-7 rounded-lg bg-slate-900 text-white">
                    <div className="grid h-full place-items-center text-xs font-semibold">A</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Cliente cria a solicitação</div>
                    <div className="text-sm text-slate-600">Dados essenciais e coleta.</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5 h-7 w-7 rounded-lg bg-slate-900 text-white">
                    <div className="grid h-full place-items-center text-xs font-semibold">B</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Transportadoras enviam propostas</div>
                    <div className="text-sm text-slate-600">Uma proposta por solicitação, com controle.</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5 h-7 w-7 rounded-lg bg-slate-900 text-white">
                    <div className="grid h-full place-items-center text-xs font-semibold">C</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Cliente escolhe a vencedora</div>
                    <div className="text-sm text-slate-600">Status atualiza e novas propostas param.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Social proof</div>
              <div className="mt-2 text-sm text-slate-700">
                Ideal para empresas que precisam de processo e rastreabilidade, sem complicar o dia a dia.
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900">RLS & multiempresa</div>
                  <div className="mt-1 text-xs text-slate-500">Segurança por padrão.</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900">Status consistente</div>
                  <div className="mt-1 text-xs text-slate-500">OPEN/CLOSED • SENT/WON/LOST.</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900">SSR + Auth</div>
                  <div className="mt-1 text-xs text-slate-500">Sessão confiável.</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900">Sem ruído</div>
                  <div className="mt-1 text-xs text-slate-500">Foco em decisão.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="rounded-2xl border border-slate-200 bg-slate-900 p-7 text-white shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Vamos rodar sua primeira cotação?</h2>
              <p className="mt-1 text-sm text-slate-300">
                Entre e acesse a área do cliente ou do transportador.
              </p>
            </div>
            <Link href="/login">
              <Button>Entrar agora</Button>
            </Link>
          </div>
        </section>

        <footer className="pb-2 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} RotaClick. Plataforma B2B de cotação de frete.
        </footer>
      </div>
    </div>
  );
}
