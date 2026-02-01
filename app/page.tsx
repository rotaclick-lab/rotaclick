import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

export default function Home() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
      <section className="space-y-5">
        <h1 className="text-3xl font-semibold tracking-tight text-brand-secondary sm:text-4xl">
          Cote e solicite fretes B2B com múltiplas propostas.
        </h1>
        <p className="text-base text-slate-700 sm:text-lg">
          <span className="font-medium text-slate-900">RotaClick</span>: Cotação de
          frete B2B em minutos.
        </p>

        <ul className="space-y-2 text-slate-700">
          <li className="flex gap-2">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand-primary" />
            <span>Envie uma solicitação e receba propostas em um só lugar.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand-primary" />
            <span>Compare prazos, valores e condições com clareza.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand-primary" />
            <span>Fluxo simples para times comerciais e operação.</span>
          </li>
        </ul>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button>Ir para login</Button>
          </Link>
          <span className="text-sm text-slate-500">Sem cadastro nesta etapa.</span>
        </div>
      </section>

      <aside>
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            RotaClick
          </h2>
          <p className="text-slate-700">
            Plataforma B2B de cotação e solicitação de fretes com múltiplas
            propostas.
          </p>
          <p className="text-sm text-slate-500">
            Esta é a base visual inicial (sem imagens, sem animações e sem
            autenticação).
          </p>
        </Card>
      </aside>
    </div>
  );
}
