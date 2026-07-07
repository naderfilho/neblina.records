"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Trash2, HelpCircle, Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import type { Comment } from "@/lib/types";

type Props = {
  recordId: string;
  initial: Comment[];
  userId: string | null;
  userName: string | null;
  isAdmin: boolean;
};

export default function Comments({ recordId, initial, userId, userName, isAdmin }: Props) {
  const [comments, setComments] = useState<Comment[]>(initial);
  const [body, setBody] = useState("");
  const [isQuestion, setIsQuestion] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !userId) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({
        record_id: recordId,
        user_id: userId,
        author_name: userName ?? "Cliente",
        body: body.trim(),
        is_question: isQuestion,
      })
      .select()
      .single();
    setLoading(false);
    if (!error && data) {
      setComments((c) => [data as Comment, ...c]);
      setBody("");
      setIsQuestion(false);
    }
  }

  async function remove(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (!error) setComments((c) => c.filter((x) => x.id !== id));
  }

  return (
    <section className="mt-16">
      <h2 className="mb-6 flex items-center gap-2 font-display text-2xl text-ink">
        <MessageSquare size={22} className="text-brand" />
        Comentários & Perguntas
        <span className="text-base text-muted">({comments.length})</span>
      </h2>

      {userId ? (
        <form onSubmit={submit} className="mb-8 card p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Deixe um comentário ou faça uma pergunta sobre este disco…"
            rows={3}
            className="w-full resize-none rounded-xl border border-line bg-bg-soft p-3 text-sm text-ink outline-none focus:border-brand/50"
          />
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={isQuestion} onChange={(e) => setIsQuestion(e.target.checked)} className="accent-brand" />
              <HelpCircle size={15} /> É uma pergunta
            </label>
            <button
              type="submit"
              disabled={loading || !body.trim()}
              className="btn-brand flex items-center gap-2 rounded-xl px-5 py-2 text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Publicar
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-xl border border-line bg-panel p-4 text-center text-sm text-muted">
          <Link href="/login" className="font-medium text-brand hover:underline">Entre</Link> ou{" "}
          <Link href="/cadastro" className="font-medium text-brand hover:underline">cadastre-se</Link> para comentar.
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="py-8 text-center text-muted">Seja o primeiro a comentar.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-line bg-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-sm font-bold text-brand">
                    {(c.author_name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{c.author_name ?? "Cliente"}</p>
                    <p className="text-xs text-faint">{formatDateTime(c.created_at)}</p>
                  </div>
                  {c.is_question && (
                    <span className="ml-1 flex items-center gap-1 rounded-full bg-teal/15 px-2 py-0.5 text-[11px] text-teal">
                      <HelpCircle size={11} /> Pergunta
                    </span>
                  )}
                </div>
                {(isAdmin || c.user_id === userId) && (
                  <button
                    onClick={() => remove(c.id)}
                    className="rounded-lg p-1.5 text-faint hover:bg-panel-2 hover:text-red-400"
                    aria-label="Apagar"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{c.body}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
