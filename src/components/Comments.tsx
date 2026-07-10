"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Trash2, HelpCircle, Send, Loader2, Reply, CornerDownRight } from "lucide-react";
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
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  async function submitReply(parentId: string) {
    if (!replyBody.trim() || !userId) return;
    setReplyLoading(true);
    const { data, error } = await createClient()
      .from("comments")
      .insert({ record_id: recordId, user_id: userId, author_name: userName ?? "Cliente", body: replyBody.trim(), is_question: false, parent_id: parentId })
      .select()
      .single();
    setReplyLoading(false);
    if (!error && data) {
      setComments((c) => [...c, data as Comment]);
      setReplyBody("");
      setReplyTo(null);
    }
  }

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
    if (!error) setComments((c) => c.filter((x) => x.id !== id && x.parent_id !== id));
  }

  const roots = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

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
        {roots.length === 0 ? (
          <p className="py-8 text-center text-muted">Seja o primeiro a comentar.</p>
        ) : (
          roots.map((c) => (
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
                  <button onClick={() => remove(c.id)} className="rounded-lg p-1.5 text-faint hover:bg-panel-2 hover:text-red-400" aria-label="Apagar">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{c.body}</p>

              {userId && (
                <button onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyBody(""); }} className="mt-2 flex items-center gap-1 text-xs text-muted hover:text-brand">
                  <Reply size={13} /> Responder
                </button>
              )}

              {replyTo === c.id && userId && (
                <div className="mt-3">
                  <textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} rows={2} placeholder="Escreva uma resposta…"
                    className="w-full resize-none rounded-xl border border-line bg-bg-soft p-3 text-sm text-ink outline-none focus:border-brand/50" />
                  <div className="mt-2 flex justify-end gap-2">
                    <button onClick={() => setReplyTo(null)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:text-ink">Cancelar</button>
                    <button onClick={() => submitReply(c.id)} disabled={replyLoading || !replyBody.trim()} className="btn-brand flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs disabled:opacity-50">
                      {replyLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Responder
                    </button>
                  </div>
                </div>
              )}

              {repliesOf(c.id).map((rp) => (
                <div key={rp.id} className="mt-3 ml-3 border-l-2 border-line pl-3 sm:ml-5 sm:pl-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CornerDownRight size={14} className="text-faint" />
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal/15 text-xs font-bold text-teal">
                        {(rp.author_name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{rp.author_name ?? "Cliente"}</p>
                        <p className="text-[11px] text-faint">{formatDateTime(rp.created_at)}</p>
                      </div>
                    </div>
                    {(isAdmin || rp.user_id === userId) && (
                      <button onClick={() => remove(rp.id)} className="rounded-lg p-1.5 text-faint hover:bg-panel-2 hover:text-red-400" aria-label="Apagar">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">{rp.body}</p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
