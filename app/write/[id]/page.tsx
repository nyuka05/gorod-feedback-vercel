"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import type { Participant, Sender } from "@/lib/types";

export default function WritePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [accepting, setAccepting] = useState(true);
  const [sender, setSender] = useState("");
  const [likes, setLikes] = useState(1);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "sending">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/bootstrap", { cache: "no-store" }).then((response) => response.json()).then((data) => {
      setParticipants(data.participants);
      setSenders(data.senders);
      setAccepting(data.acceptingFeedback);
      setStatus("ready");
    }).catch(() => setError("Не удалось открыть форму"));
  }, []);

  const recipient = useMemo(() => participants.find((item) => item.id === params.id), [participants, params.id]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!sender) return setError("Выберите себя в поле «От кого»");
    const [senderType, senderId] = sender.split(":");
    setStatus("sending");
    const response = await fetch("/api/feedback", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ senderType, senderId, recipientId: params.id, likes, message }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Не удалось отправить сообщение");
      setStatus("ready");
      return;
    }
    router.push(`/wall/${params.id}`);
  }

  if (status === "loading") return <><SiteHeader /><div className="shell narrow state-card page-state">Открываем форму…</div></>;
  if (!recipient) return <><SiteHeader /><div className="shell narrow state-card page-state">Участник не найден. <Link href="/">Вернуться к списку</Link></div></>;

  return (
    <main>
      <SiteHeader compact />
      <section className="shell narrow form-page">
        <Link className="back-link" href="/">← Все участники</Link>
        <div className="recipient-panel">
          <div><span>Сообщение для</span><h1>{recipient.fullName}</h1><p>{recipient.project}</p></div>
        </div>
        <form className="feedback-form" onSubmit={submit}>
            {!accepting && <div className="form-alert">Приём сообщений завершён. Доски участников остаются доступными.</div>}
            <label className="field">
              <span>От кого <b>*</b></span>
              <select value={sender} onChange={(event) => setSender(event.target.value)} required>
                <option value="">Выберите своё имя</option>
                <optgroup label="Участники">{senders.filter((item) => item.type === "participant").map((item) => <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>{item.label}</option>)}</optgroup>
                <optgroup label="Команда ШГП">{senders.filter((item) => item.type === "organizer").map((item) => <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>{item.label}</option>)}</optgroup>
              </select>
              <small>Выбор своего имени — организационное правило.</small>
            </label>
            <fieldset className="likes-field">
              <legend>Сколько лайков поставить? <b>*</b></legend>
              <div className="likes-row" role="radiogroup" aria-label="Количество лайков">{Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <button type="button" key={value} className={likes >= value ? "selected" : ""} onClick={() => setLikes(value)} role="radio" aria-checked={likes === value} aria-label={`${value} из 10`}><span className="rating-heart" aria-hidden>♥</span><small>{value}</small></button>)}</div>
              <div className="likes-caption"><span>Немного поддержки</span><strong><span aria-hidden>♥</span> {likes}</strong><span>В самое сердце</span></div>
            </fieldset>
            <label className="field">
              <span>Тёплое сообщение <em>необязательно</em></span>
              <textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 500))} rows={6} placeholder="Что особенно откликнулось в выступлении?" />
              <small className="counter">{message.length} / 500</small>
            </label>
            {error && <div className="form-error">{error}</div>}
            <button className="button primary submit-button" disabled={!accepting || status === "sending"}>{status === "sending" ? "Отправляем…" : "Отправить поддержку"}</button>
        </form>
      </section>
    </main>
  );
}
