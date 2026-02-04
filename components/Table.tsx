import * as React from "react";

export type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

export function Table({ className = "", ...props }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table
        className={
          [
            "w-full text-left text-sm",
            // separadores leves entre linhas
            "[&_tr]:border-b [&_tr:last-child]:border-b-0",
            // padding consistente
            "[&_th]:px-4 [&_th]:py-3 [&_td]:px-4 [&_td]:py-3",
            // head
            "[&_thead_th]:bg-slate-50 [&_thead_th]:text-xs [&_thead_th]:font-semibold [&_thead_th]:uppercase [&_thead_th]:tracking-wide [&_thead_th]:text-slate-600",
            // body
            "[&_tbody_tr:hover]:bg-slate-50/70",
            className,
          ].join(" ")
        }
        {...props}
      />
    </div>
  );
}

export function Th({ className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={["align-middle", className].join(" ")} {...props} />;
}

export function Td({ className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={["align-middle text-slate-700", className].join(" ")} {...props} />;
}

export function Tr({ className = "", ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={["", className].join(" ")} {...props} />;
}
