import * as React from "react";
import { Topbar } from "./Topbar";
import { Sidebar, type AppRole } from "./Sidebar";

export type AppShellProps = {
  role?: AppRole | null;
  topbarRight?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ role, topbarRight, children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <Topbar right={topbarRight} />

      <div className="mx-auto flex max-w-7xl">
        <Sidebar role={role} />

        <main className="w-full px-4 py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
