import * as React from "react";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  cta?: React.ReactNode;
};

export function PageHeader({ title, subtitle, cta }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {cta ? <div className="shrink-0">{cta}</div> : null}
    </div>
  );
}
