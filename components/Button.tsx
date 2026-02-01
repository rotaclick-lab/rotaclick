import * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-600",
  secondary:
    "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 focus-visible:ring-slate-400",
  ghost:
    "bg-transparent text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-400",
};

export function Button({
  variant = "primary",
  className = "",
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={[
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
        "transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "disabled:opacity-50 disabled:pointer-events-none",
        VARIANT_CLASSES[variant],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
