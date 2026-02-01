import * as React from "react";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-xl border border-slate-200 bg-white p-6 shadow-sm",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
