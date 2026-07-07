"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
          setError("Preencha nome, sobrenome e telefone.");
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() },
          },
        });
        if (error) throw error;

        if (data.session) {
          await supabase.rpc("touch_last_login");
          router.push(next);
          router.refresh();
        } else {
          setNotice(
            "Cadastro criado! Verifique seu e-mail para confirmar a conta e depois faça login.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await supabase.rpc("touch_last_login");
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ocorreu um erro.";
      setError(
        msg.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : msg.includes("already registered")
            ? "Este e-mail já possui cadastro."
            : msg,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mist-bg flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center gap-2 text-sm text-muted hover:text-brand">
          <ArrowLeft size={16} /> Voltar à loja
        </Link>

        <div className="card p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <Image src="/logo.png" alt="Neblina Records" width={72} height={72} className="h-18 w-18 object-contain" />
            <h1 className="mt-3 font-display text-2xl text-ink">
              {mode === "login" ? "Entrar na conta" : "Criar cadastro"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {mode === "login"
                ? "Acesse para finalizar suas compras."
                : "Cadastre-se para comprar e comentar."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nome">
                    <input className="ipt" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </Field>
                  <Field label="Sobrenome">
                    <input className="ipt" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </Field>
                </div>
                <Field label="Telefone / WhatsApp">
                  <input
                    className="ipt"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(22) 99999-9999"
                    required
                  />
                </Field>
              </>
            )}

            <Field label="E-mail">
              <input
                className="ipt"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>

            <Field label="Senha">
              <div className="relative">
                <input
                  className="ipt pr-10"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
            {notice && <p className="rounded-lg bg-teal/10 px-3 py-2 text-sm text-teal">{notice}</p>}

            <button type="submit" disabled={loading} className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm disabled:opacity-60">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "login" ? "Entrar" : "Cadastrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === "login" ? (
              <>
                Não tem conta?{" "}
                <Link href="/cadastro" className="font-medium text-brand hover:underline">
                  Cadastre-se
                </Link>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <Link href="/login" className="font-medium text-brand hover:underline">
                  Entrar
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      <style jsx global>{`
        .ipt {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--color-line);
          background: var(--color-bg-soft);
          padding: 0.65rem 0.85rem;
          font-size: 0.9rem;
          color: var(--color-ink);
          outline: none;
        }
        .ipt:focus {
          border-color: color-mix(in srgb, var(--color-brand) 60%, transparent);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">{label}</span>
      {children}
    </label>
  );
}
