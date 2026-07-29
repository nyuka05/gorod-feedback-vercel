"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import type { AdminOrganizer, AdminParticipant, ResultRow } from "@/lib/types";

type Tab = "people" | "results" | "settings";
type Dashboard = {
  acceptingFeedback: boolean;
  participants: AdminParticipant[];
  organizers: AdminOrganizer[];
  results: ResultRow[];
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Не удалось выполнить действие");
  return payload as T;
}

function ParticipantRow({ participant, onChanged }: { participant: AdminParticipant; onChanged: () => void }) {
  const [item, setItem] = useState(participant);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api("/api/admin/participants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Удалить участника «${item.fullName}»? При наличии отзывов он будет деактивирован.`)) return;
    setBusy(true);
    try {
      await api(`/api/admin/participants?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`admin-row participant-admin-row ${item.isActive ? "" : "is-muted"}`}>
      <div className="admin-id">{item.id}</div>
      <input aria-label="ФИ участника" value={item.fullName} onChange={(event) => setItem({ ...item, fullName: event.target.value })} />
      <input aria-label="Название проекта" value={item.project} onChange={(event) => setItem({ ...item, project: event.target.value })} />
      <input className="order-input" aria-label="Порядок" type="number" value={item.sortOrder} onChange={(event) => setItem({ ...item, sortOrder: Number(event.target.value) })} />
      <label className="compact-toggle"><input type="checkbox" checked={item.isActive} onChange={(event) => setItem({ ...item, isActive: event.target.checked })} /><span>Активен</span></label>
      <div className="row-actions"><button type="button" onClick={save} disabled={busy}>Сохранить</button><button className="danger-link" type="button" onClick={remove} disabled={busy}>Удалить</button></div>
    </div>
  );
}

function OrganizerRow({ organizer, onChanged }: { organizer: AdminOrganizer; onChanged: () => void }) {
  const [item, setItem] = useState(organizer);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api("/api/admin/organizers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
      onChanged();
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!window.confirm(`Удалить организатора «${item.fullName}»?`)) return;
    setBusy(true);
    try {
      await api(`/api/admin/organizers?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      onChanged();
    } finally { setBusy(false); }
  }

  return (
    <div className={`admin-row organizer-admin-row ${item.isActive ? "" : "is-muted"}`}>
      <div className="admin-id">{item.id}</div>
      <input aria-label="Роль или имя представителя Команды ШГП" value={item.fullName} onChange={(event) => setItem({ ...item, fullName: event.target.value })} />
      <label className="compact-toggle"><input type="checkbox" checked={item.isActive} onChange={(event) => setItem({ ...item, isActive: event.target.checked })} /><span>Активен</span></label>
      <div className="row-actions"><button type="button" onClick={save} disabled={busy}>Сохранить</button><button className="danger-link" type="button" onClick={remove} disabled={busy}>Удалить</button></div>
    </div>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [tab, setTab] = useState<Tab>("people");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [participantDraft, setParticipantDraft] = useState({ id: "", fullName: "", project: "", sortOrder: 20 });
  const [organizerDraft, setOrganizerDraft] = useState({ id: "", fullName: "" });

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api<Dashboard>("/api/admin/dashboard", { cache: "no-store" });
      setDashboard(data);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить данные");
    }
  }, []);

  useEffect(() => {
    api<{ authenticated: boolean }>("/api/admin/session", { cache: "no-store" })
      .then((data) => { setAuthenticated(data.authenticated); if (data.authenticated) loadDashboard(); })
      .catch(() => setAuthenticated(false));
  }, [loadDashboard]);

  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      setAuthenticated(true); setPassword(""); await loadDashboard();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Ошибка входа"); }
    finally { setBusy(false); }
  }

  async function logout() {
    await api("/api/admin/logout", { method: "POST" });
    setAuthenticated(false); setDashboard(null);
  }

  async function addParticipant(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api("/api/admin/participants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(participantDraft) });
      setParticipantDraft({ id: "", fullName: "", project: "", sortOrder: (dashboard?.participants.length ?? 19) + 1 });
      await loadDashboard();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Ошибка добавления"); }
    finally { setBusy(false); }
  }

  async function addOrganizer(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api("/api/admin/organizers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(organizerDraft) });
      setOrganizerDraft({ id: "", fullName: "" }); await loadDashboard();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Ошибка добавления"); }
    finally { setBusy(false); }
  }

  async function importFile(file: File | undefined, kind: "participants" | "organizers") {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const workbook = XLSX.read(await file.arrayBuffer());
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      const result = await api<{ imported: number }>("/api/admin/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [kind]: rows }) });
      window.alert(`Импортировано записей: ${result.imported}`);
      await loadDashboard();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Ошибка импорта"); }
    finally { setBusy(false); }
  }

  async function toggleAccepting() {
    if (!dashboard) return;
    const next = !dashboard.acceptingFeedback;
    setDashboard({ ...dashboard, acceptingFeedback: next });
    try {
      await api("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acceptingFeedback: next }) });
    } catch (reason) {
      setDashboard({ ...dashboard, acceptingFeedback: !next });
      setError(reason instanceof Error ? reason.message : "Не удалось изменить режим");
    }
  }

  async function exportResults() {
    const data = await api<{ results: Record<string, unknown>[]; messages: Record<string, unknown>[] }>("/api/admin/export");
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.results), "Итоги");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.messages), "Отзывы");
    XLSX.writeFile(workbook, `feedback-results-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async function resetFeedback() {
    if (!window.confirm("Удалить все оценки и сообщения? Участники и организаторы останутся.")) return;
    await api("/api/admin/reset", { method: "DELETE" }); await loadDashboard();
  }

  if (authenticated === null) return <main className="admin-page"><div className="admin-login state-card">Проверяем доступ…</div></main>;
  if (!authenticated) return (
    <main className="admin-page">
      <form className="admin-login" onSubmit={login}>
        <Link className="brand admin-brand" href="/"><span className="brand-mark">ГУ</span><span>Городской университет</span></Link>
        <p className="eyebrow">Служебный вход</p><h1>Панель организатора</h1>
        <p>Управление участниками, сбором обратной связи и итогами.</p>
        <label className="field"><span>Пароль</span><input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {error && <div className="form-error">{error}</div>}
        <button className="button primary" disabled={busy}>{busy ? "Входим…" : "Войти"}</button>
        <Link className="back-link" href="/">← Вернуться на площадку</Link>
      </form>
    </main>
  );

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link className="brand" href="/"><span className="brand-mark">ГУ</span><span>Панель организатора</span></Link>
        <div className={`accepting-badge ${dashboard?.acceptingFeedback ? "open" : "closed"}`}>{dashboard?.acceptingFeedback ? "Голосование включено" : "Голосование выключено"}</div>
        <button className="text-button" type="button" onClick={logout}>Выйти</button>
      </header>
      <div className="admin-shell">
        <aside className="admin-nav">
          <button className={tab === "people" ? "active" : ""} onClick={() => setTab("people")}><span>01</span> Люди</button>
          <button className={tab === "results" ? "active" : ""} onClick={() => setTab("results")}><span>02</span> Итоги</button>
          <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}><span>03</span> Настройки</button>
        </aside>
        <section className="admin-content">
          {error && <div className="form-error admin-error">{error}<button onClick={() => setError("")}>×</button></div>}
          {!dashboard && <div className="state-card">Загружаем данные…</div>}

          {dashboard && tab === "people" && <>
            <div className="admin-title"><div><p className="eyebrow">Состав площадки</p><h1>Участники</h1></div><label className="import-button">Импорт Excel / CSV<input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => importFile(event.target.files?.[0], "participants")} /></label></div>
            <p className="admin-help">Колонки импорта: <b>id</b>, <b>fullName</b>, <b>project</b>, <b>sortOrder</b>. Допустимы русские заголовки «ФИ», «Проект», «Порядок».</p>
            <form className="quick-add participant-add" onSubmit={addParticipant}>
              <input placeholder="ID (можно оставить пустым)" value={participantDraft.id} onChange={(event) => setParticipantDraft({ ...participantDraft, id: event.target.value })} />
              <input required placeholder="Фамилия и имя" value={participantDraft.fullName} onChange={(event) => setParticipantDraft({ ...participantDraft, fullName: event.target.value })} />
              <input required placeholder="Название проекта" value={participantDraft.project} onChange={(event) => setParticipantDraft({ ...participantDraft, project: event.target.value })} />
              <input aria-label="Порядок" type="number" value={participantDraft.sortOrder} onChange={(event) => setParticipantDraft({ ...participantDraft, sortOrder: Number(event.target.value) })} />
              <button disabled={busy}>+ Добавить</button>
            </form>
            <div className="admin-list">
              <div className="admin-row-head participant-admin-row"><span>ID</span><span>Фамилия и имя</span><span>Проект</span><span>№</span><span>Статус</span><span>Действия</span></div>
              {dashboard.participants.map((participant) => <ParticipantRow key={participant.id} participant={participant} onChanged={loadDashboard} />)}
            </div>

            <div className="admin-title subsection"><div><p className="eyebrow">Несколько независимых отправителей</p><h2>Команда ШГП</h2></div><label className="import-button">Импорт списка<input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => importFile(event.target.files?.[0], "organizers")} /></label></div>
            <p className="admin-help">Трекер, организатор и методист отправляют и редактируют собственные отзывы — сообщения друг друга не перезаписываются.</p>
            <form className="quick-add organizer-add" onSubmit={addOrganizer}>
              <input placeholder="ID (можно оставить пустым)" value={organizerDraft.id} onChange={(event) => setOrganizerDraft({ ...organizerDraft, id: event.target.value })} />
              <input required placeholder="Роль или имя" value={organizerDraft.fullName} onChange={(event) => setOrganizerDraft({ ...organizerDraft, fullName: event.target.value })} />
              <button disabled={busy}>+ Добавить</button>
            </form>
            <div className="admin-list">
              {dashboard.organizers.map((organizer) => <OrganizerRow key={organizer.id} organizer={organizer} onChanged={loadDashboard} />)}
            </div>
          </>}

          {dashboard && tab === "results" && <>
            <div className="admin-title"><div><p className="eyebrow">Текущие данные</p><h1>Итоги голосования</h1></div><button className="button primary" type="button" onClick={exportResults}>Скачать Excel</button></div>
            <div className="result-summary"><div><strong>{dashboard.results.reduce((sum, row) => sum + row.totalLikes, 0)}</strong><span>лайков выдано</span></div><div><strong>{dashboard.results.reduce((sum, row) => sum + row.senderCount, 0)}</strong><span>оценок отправлено</span></div><div><strong>{dashboard.results.filter((row) => row.totalLikes > 0).length}</strong><span>участников с оценками</span></div></div>
            <div className="results-table">
              <div className="results-head"><span>Место</span><span>Участник</span><span>Проект</span><span>Отправителей</span><span>Лайки</span></div>
              {dashboard.results.map((row, index) => <div className="result-row" key={row.id}><b>{index + 1}</b><strong>{row.fullName}</strong><span>{row.project}</span><span>{row.senderCount}</span><em>{row.totalLikes}</em></div>)}
            </div>
          </>}

          {dashboard && tab === "settings" && <>
            <div className="admin-title"><div><p className="eyebrow">Управление площадкой</p><h1>Настройки</h1></div></div>
            <div className="settings-card"><div><h2>Приём обратной связи</h2><p>После закрытия уже опубликованные стены и суммы лайков останутся видимыми, но форма отправки станет недоступна.</p></div><button className={`big-switch ${dashboard.acceptingFeedback ? "on" : ""}`} type="button" role="switch" aria-checked={dashboard.acceptingFeedback} onClick={toggleAccepting}><span />{dashboard.acceptingFeedback ? "Открыт" : "Закрыт"}</button></div>
            <div className="settings-card danger-zone"><div><h2>Сбросить тестовые данные</h2><p>Удаляет все оценки и сообщения. Состав участников и Команды ШГП сохраняется.</p></div><button className="danger-button" type="button" onClick={resetFeedback}>Удалить отзывы</button></div>
          </>}
        </section>
      </div>
    </main>
  );
}
