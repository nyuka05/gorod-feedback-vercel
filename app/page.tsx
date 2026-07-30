"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import type { Participant } from "@/lib/types";

export default function Home() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [accepting, setAccepting] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/bootstrap", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Не удалось загрузить участников");
        return response.json();
      })
      .then((data) => {
        setParticipants(data.participants);
        setAccepting(data.acceptingFeedback);
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main>
      <SiteHeader />
      <section className="hero shell">
        <div className="hero-copy">
          <span className="eyebrow">Финальные питчинги</span>
          <h1>Поддержите тех, кто делает город живым</h1>
          <p>Оставьте коллегам тёплое сообщение и поставьте от 1 до 10 лайков за выступление.</p>
        </div>
        <div className="hero-note" aria-label="Как это работает">
          <span className="hero-note-number">19</span>
          <span>городских продюсеров<br />и одна общая поддержка</span>
        </div>
      </section>

      <section className="shell participants-section">
        <div className="section-heading">
          <div><span className="eyebrow">Участники</span><h2>Выберите выступление</h2></div>
          <p>Лайки обновляются после перезагрузки</p>
        </div>
        {loading && <div className="state-card">Собираем карточки участников…</div>}
        {error && <div className="state-card error-card">{error}</div>}
        {!loading && !error && (
          <div className="participant-grid">
            {participants.map((participant, index) => (
              <article className="participant-card" key={participant.id}>
                <div className="card-topline">
                  <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="likes-badge"><span aria-hidden>♥</span> {participant.totalLikes}</span>
                </div>
                <div className="participant-copy"><h3>{participant.fullName}</h3><p>{participant.project}</p></div>
                <div className="card-actions">
                  <Link className={`button primary ${accepting ? "" : "disabled"}`} href={`/write/${participant.id}`} aria-disabled={!accepting}>Написать</Link>
                  <Link className="button secondary" href={`/wall/${participant.id}`}>Посмотреть</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <footer className="site-footer shell"><span>Городской университет 2.0</span><span>Школа городских продюсеров · Финал</span></footer>
    </main>
  );
}
