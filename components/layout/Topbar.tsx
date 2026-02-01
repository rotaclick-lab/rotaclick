import * as React from "react";
import Link from "next/link";

export function Topbar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-base font-semibold tracking-tight text-slate-900">
          <span className="text-sky-600">Rota</span>Click
        </Link>
        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
    </header>
  );
}
