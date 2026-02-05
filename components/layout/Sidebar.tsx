import Link from "next/link";

export type AppRole = "ADMIN" | "CLIENTE" | "TRANSPORTADOR";

type NavItem = {
  label: string;
  href: string;
  roles: AppRole[];
};

const NAV: NavItem[] = [
  {
    label: "Solicitações",
    href: "/app/solicitacoes",
    roles: ["ADMIN", "CLIENTE"],
  },
  {
    label: "Cotações",
    href: "/app/cotacoes",
    roles: ["ADMIN", "CLIENTE"],
  },
  {
    label: "Nova cotação",
    href: "/app/cotacoes/nova",
    roles: ["ADMIN", "CLIENTE"],
  },
  {
    label: "Solicitações abertas",
    href: "/carrier/solicitacoes",
    roles: ["ADMIN", "TRANSPORTADOR"],
  },
  {
    label: "Tabelas de frete",
    href: "/carrier/tabelas",
    roles: ["TRANSPORTADOR"],
  },
];

export function Sidebar({ role }: { role?: AppRole | null }) {
  const items = NAV.filter((i) => (role ? i.roles.includes(role) : false));

  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200/80 bg-white lg:block">
      <div className="px-3 py-4">
        <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Navegação
        </div>
        <nav className="mt-3 space-y-1">
          {items.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Seu acesso ainda não está configurado.
            </div>
          ) : (
            items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group block rounded-lg px-3 py-2 text-sm font-medium text-slate-700",
                  "hover:bg-slate-50 hover:text-slate-900",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2",
                  "aria-[current=page]:bg-slate-50 aria-[current=page]:text-slate-900",
                  "aria-[current=page]:shadow-[inset_2px_0_0_0_#0284c7]",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))
          )}
        </nav>
      </div>
    </aside>
  );
}
