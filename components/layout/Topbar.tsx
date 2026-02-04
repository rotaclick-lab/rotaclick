import * as React from "react";
import Link from "next/link";

export function Topbar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-tight text-slate-900">
          <span className="text-sky-700">Rota</span>Click
        </Link>
        {right ? <div className="ml-auto flex items-center gap-2">{right}</div> : null}
      </div>
    </header>
  );
}
