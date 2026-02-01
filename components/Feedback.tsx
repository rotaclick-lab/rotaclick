type FeedbackVariant = "success" | "error" | "warning" | "info";

export type FeedbackProps = {
  variant: FeedbackVariant;
  title: string;
  description?: string;
};

const VARIANT_STYLES: Record<FeedbackVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  info: "border-sky-200 bg-sky-50 text-sky-950",
};

const TITLE_STYLES: Record<FeedbackVariant, string> = {
  success: "text-emerald-900",
  error: "text-red-900",
  warning: "text-amber-950",
  info: "text-sky-950",
};

export function Feedback({ variant, title, description }: FeedbackProps) {
  return (
    <div className={["rounded-lg border p-4", VARIANT_STYLES[variant]].join(" ")}>
      <div className={["text-sm font-semibold", TITLE_STYLES[variant]].join(" ")}>
        {title}
      </div>
      {description ? (
        <div className="mt-1 text-sm text-slate-700">{description}</div>
      ) : null}
    </div>
  );
}
