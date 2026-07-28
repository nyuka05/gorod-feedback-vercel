"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { SiteHeader } from "@/components/SiteHeader";
import type { WallMessage } from "@/lib/types";

type WallData = { participant: { id: string; fullName: string; project: string; photoUrl: string | null; totalLikes: number }; messages: WallMessage[] };

export default function WallPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<WallData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`/api/wall/${params.id}`, { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Доска не найдена");
      return response.json();
    }).then(setData).catch((reason) => setError(reason.message));
  }, [params.id]);
  return (
    <main>
      <SiteHeader compact />
      <section className="shell wall-page">
        <Link className="back-link" href="/">← Все участники</Link>
        {error && <div className="state-card error-card">{error}</div>}
        {!data && !error && <div className="state-card">Собираем сообщения…</div>}
        {data && <>
          <div className="wall-hero">
            <Avatar name={data.participant.fullName} src={data.participant.photoUrl} size="large" />
            <div className="wall-person"><span className="eyebrow">Доска поддержки</span><h1>{data.participant.fullName}</h1><p>{data.participant.project}</p></div>
            <div className="total-likes"><span aria-hidden>♥</span><strong>{data.participant.totalLikes}</strong><small>лайков</small></div>
          </div>
          <div className="wall-heading"><h2>Сообщения от коллег</h2><Link className="button primary" href={`/write/${data.participant.id}`}>Добавить своё</Link></div>
          {data.messages.length === 0 ? <div className="empty-wall"><span aria-hidden>✦</span><h3>Здесь скоро появятся тёплые слова</h3><p>Можно стать первым, кто поддержит это выступление.</p></div> : (
            <div className="message-grid">{data.messages.map((message, index) => <article className={`message-card tone-${index % 4}`} key={message.id}>
              <span className="quote-mark" aria-hidden>“</span><p>{message.message}</p>
              <footer><Avatar name={message.senderName || "Команда"} size="small" seed={index + 2} /><div><strong>{message.senderName || "Отправитель"}</strong>{message.senderType === "organizer" && <span>Команда Школы</span>}</div></footer>
            </article>)}</div>
          )}
        </>}
      </section>
    </main>
  );
}
