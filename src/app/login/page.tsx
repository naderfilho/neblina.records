import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mist-bg min-h-screen" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
