type RequestStatus = "OPEN" | "CLOSED" | "CANCELLED";
type QuoteStatus = "SENT" | "WON" | "LOST" | "WITHDRAWN";

type Props =
  | {
      kind: "request";
      status: RequestStatus;
    }
  | {
      kind: "quote";
      status: QuoteStatus;
    };

const REQUEST_LABEL: Record<RequestStatus, string> = {
  OPEN: "Aberta",
  CLOSED: "Fechada",
  CANCELLED: "Cancelada",
};

const QUOTE_LABEL: Record<QuoteStatus, string> = {
  SENT: "Enviada",
  WITHDRAWN: "Retirada",
  WON: "Vencedora",
  LOST: "Perdedora",
};

function badgeStyles(label: string) {
  // Mantém consistência visual usando apenas label (não altera regras/valores)
  switch (label) {
    case "Aberta":
    case "Enviada":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "Fechada":
    case "Vencedora":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "Cancelada":
    case "Perdedora":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function StatusBadge(props: Props) {
  const label =
    props.kind === "request" ? REQUEST_LABEL[props.status] : QUOTE_LABEL[props.status];

  const className =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium " +
    badgeStyles(label);

  return (
    <span className={className}>
      {label}
    </span>
  );
}
