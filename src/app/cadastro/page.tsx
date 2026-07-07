import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Cadastrar" };

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="mist-bg min-h-screen" />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
