import { getD1 } from "@/db";

const participantSeeds = [
  ["p01", "Анна Волкова", "Двор как гостиная"],
  ["p02", "Артём Лебедев", "Соседский клуб"],
  ["p03", "Вера Смирнова", "Городские истории"],
  ["p04", "Даниил Орлов", "Маршрут выходного дня"],
  ["p05", "Екатерина Белова", "Тёплая мастерская"],
  ["p06", "Иван Кузнецов", "Зелёный квартал"],
  ["p07", "Ксения Морозова", "Открытая сцена"],
  ["p08", "Лев Соколов", "Город для детей"],
  ["p09", "Мария Новикова", "Место встречи"],
  ["p10", "Михаил Попов", "Река рядом"],
  ["p11", "Надежда Фёдорова", "Архив района"],
  ["p12", "Никита Павлов", "Веломаршрут"],
  ["p13", "Ольга Семёнова", "Сад во дворе"],
  ["p14", "Павел Васильев", "Ночной лекторий"],
  ["p15", "Полина Алексеева", "Читающий город"],
  ["p16", "Роман Петров", "Мастерская улиц"],
  ["p17", "Софья Михайлова", "Добрые соседи"],
  ["p18", "Тимофей Григорьев", "Площадь событий"],
  ["p19", "Юлия Макарова", "Голос района"],
] as const;

const organizerSeeds = [
  ["o01", "Александра Миронова"],
  ["o02", "Кирилл Ефремов"],
  ["o03", "Людмила Савина"],
] as const;

let initialization: Promise<void> | null = null;

export async function ensureDatabase() {
  if (initialization) return initialization;
  initialization = initialize();
  return initialization;
}

async function initialize() {
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      project TEXT NOT NULL,
      photo_key TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS organizers (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      sender_type TEXT NOT NULL CHECK(sender_type IN ('participant','organizer')),
      sender_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      likes INTEGER NOT NULL CHECK(likes BETWEEN 1 AND 10),
      message TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(sender_type, sender_id, recipient_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS feedback_recipient_idx ON feedback(recipient_id, created_at)"),
  ]);

  const count = await db.prepare("SELECT COUNT(*) AS count FROM participants").first<{ count: number }>();
  if ((count?.count ?? 0) === 0) {
    const now = new Date().toISOString();
    await db.batch(
      participantSeeds.map(([id, fullName, project], index) =>
        db.prepare(
          "INSERT OR IGNORE INTO participants (id, full_name, project, sort_order, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)",
        ).bind(id, fullName, project, index + 1, now),
      ),
    );
    await db.batch(
      organizerSeeds.map(([id, fullName]) =>
        db.prepare(
          "INSERT OR IGNORE INTO organizers (id, full_name, is_active, created_at) VALUES (?, ?, 1, ?)",
        ).bind(id, fullName, now),
      ),
    );
  }

  await db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('accepting_feedback', 'true')").run();
}

export async function isAcceptingFeedback() {
  await ensureDatabase();
  const row = await getD1()
    .prepare("SELECT value FROM settings WHERE key = 'accepting_feedback'")
    .first<{ value: string }>();
  return row?.value !== "false";
}

export function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function normalizeId(value: unknown, fallbackPrefix: string) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return normalized || `${fallbackPrefix}-${crypto.randomUUID().slice(0, 8)}`;
}
