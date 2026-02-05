import Link from "next/link";
import { Button } from "@/components/Button";
import { Feedback } from "@/components/Feedback";

type Props = {
  searchParams: Promise<{ message?: string }>;
};

export default async function AuthCodeErrorPage({ searchParams }: Props) {
  const sp = await searchParams;
  const message = sp.message ? decodeURIComponent(sp.message) : null;

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-10">
      <Feedback
        variant="error"
        title="Não foi possível concluir o login"
        description={
          message ??
          "A confirmação de e-mail foi recebida, mas não conseguimos criar sua sessão. Tente entrar novamente."
        }
      />

      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button>Ir para login</Button>
        </Link>
        <Link href="/">
          <Button variant="secondary">Voltar ao início</Button>
        </Link>
      </div>
    </div>
  );
}
