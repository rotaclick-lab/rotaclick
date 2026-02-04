import * as React from "react";
import { Button } from "@/components/Button";

export function UserMenu({
  email,
  onSignOut,
}: {
  email?: string | null;
  onSignOut: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-xs text-slate-600 sm:block">
        {email ?? "Minha conta"}
      </div>
      <form action={onSignOut}>
        <Button variant="secondary" type="submit">
          Sair
        </Button>
      </form>
    </div>
  );
}
