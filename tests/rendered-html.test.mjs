import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public experience exposes compact cards, team roles and message walls", async () => {
  const [home, write, wall, wallApi, feedback, header, seedData] = await Promise.all([
    source("app/page.tsx"),
    source("app/write/[id]/page.tsx"),
    source("app/wall/[id]/page.tsx"),
    source("app/api/wall/[id]/route.ts"),
    source("app/api/feedback/route.ts"),
    source("components/SiteHeader.tsx"),
    source("lib/database.ts"),
  ]);

  assert.match(home, /participant\.totalLikes/);
  assert.match(home, /\/write\//);
  assert.match(home, /\/wall\//);
  assert.doesNotMatch(home, /<Avatar/);
  assert.match(write, /senderType/);
  assert.match(write, /Array\.from\(\{ length: 10 \}/);
  assert.match(write, /optgroup label="Команда ШГП"/);
  assert.match(write, /router\.push\(`\/wall\//);
  assert.doesNotMatch(write, /Успешно отправлено/);
  assert.match(wall, /data\.messages/);
  assert.match(wall, /Поддержка городских продюсеров/);
  assert.doesNotMatch(wall, /data\.participant\.photoUrl/);
  assert.doesNotMatch(header, /Приём открыт/);
  assert.match(seedData, /\["o01", "Трекер"\]/);
  assert.match(seedData, /\["o02", "Организатор"\]/);
  assert.match(seedData, /\["o03", "Методист"\]/);
  assert.match(wallApi, /f\.created_at AS createdAt/);
  assert.match(wallApi, /ORDER BY f\.created_at ASC/);
  assert.match(feedback, /ON CONFLICT\(sender_type, sender_id, recipient_id\)/);
  assert.match(feedback, /updated_at = excluded\.updated_at/);
  assert.doesNotMatch(feedback, /created_at = excluded\.created_at/);
});

test("admin minimum scope is implemented", async () => {
  const [admin, dashboard, settings, reset, exported, database, packageJson] = await Promise.all([
    source("app/admin/page.tsx"),
    source("app/api/admin/dashboard/route.ts"),
    source("app/api/admin/settings/route.ts"),
    source("app/api/admin/reset/route.ts"),
    source("app/api/admin/export/route.ts"),
    source("db/index.ts"),
    source("package.json"),
  ]);

  assert.match(admin, /Импорт Excel \/ CSV/);
  assert.match(admin, /Скачать Excel/);
  assert.match(admin, /Команда ШГП/);
  assert.match(dashboard, /organizers/);
  assert.match(settings, /accepting_feedback/);
  assert.match(reset, /DELETE FROM feedback/);
  assert.match(exported, /created_at AS createdAt/);
  assert.match(database, /TURSO_DATABASE_URL/);
  assert.match(database, /@libsql\/client/);
  assert.doesNotMatch(packageJson, /@vercel\/blob/);
  assert.equal(JSON.parse(packageJson).scripts.build, "next build");
});
