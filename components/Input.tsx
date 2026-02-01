import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={[
        "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900",
        "placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-white",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
