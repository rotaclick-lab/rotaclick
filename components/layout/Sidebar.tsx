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
    label: "Solicitações abertas",
    href: "/carrier/solicitacoes",
    roles: ["ADMIN", "TRANSPORTADOR"],
  },
];

export function Sidebar({ role }: { role?: AppRole | null }) {
  const items = NAV.filter((i) => (role ? i.roles.includes(role) : false));

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Navegação
        </div>
        <nav className="mt-3 space-y-1">
          {items.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Seu acesso ainda não está configurado.
            </div>
          ) : (
            items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
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
