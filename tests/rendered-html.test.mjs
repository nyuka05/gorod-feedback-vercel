import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public experience exposes live totals, writing and message walls", async () => {
  const [home, write, wall, wallApi, feedback] = await Promise.all([
    source("app/page.tsx"),
    source("app/write/[id]/page.tsx"),
    source("app/wall/[id]/page.tsx"),
    source("app/api/wall/[id]/route.ts"),
    source("app/api/feedback/route.ts"),
  ]);

  assert.match(home, /participant\.totalLikes/);
  assert.match(home, /\/write\//);
  assert.match(home, /\/wall\//);
  assert.match(write, /senderType/);
  assert.match(write, /Array\.from\(\{ length: 10 \}/);
  assert.match(wall, /data\.messages/);
  assert.match(wallApi, /f\.created_at AS createdAt/);
  assert.match(wallApi, /ORDER BY f\.created_at ASC/);
  assert.match(feedback, /ON CONFLICT\(sender_type, sender_id, recipient_id\)/);
  assert.match(feedback, /updated_at = excluded\.updated_at/);
  assert.doesNotMatch(feedback, /created_at = excluded\.created_at/);
});

test("admin minimum scope is implemented", async () => {
  const [admin, dashboard, settings, reset, exported, database, photoUpload, packageJson] = await Promise.all([
    source("app/admin/page.tsx"),
    source("app/api/admin/dashboard/route.ts"),
    source("app/api/admin/settings/route.ts"),
    source("app/api/admin/reset/route.ts"),
    source("app/api/admin/export/route.ts"),
    source("db/index.ts"),
    source("app/api/admin/participants/[id]/photo/route.ts"),
    source("package.json"),
  ]);

  assert.match(admin, /Импорт Excel \/ CSV/);
  assert.match(admin, /Скачать Excel/);
  assert.match(admin, /Организаторы/);
  assert.match(dashboard, /organizers/);
  assert.match(settings, /accepting_feedback/);
  assert.match(reset, /DELETE FROM feedback/);
  assert.match(exported, /created_at AS createdAt/);
  assert.match(database, /TURSO_DATABASE_URL/);
  assert.match(database, /@libsql\/client/);
  assert.match(photoUpload, /@vercel\/blob/);
  assert.match(photoUpload, /MAX_PHOTO_BYTES = 4 \* 1024 \* 1024/);
  assert.equal(JSON.parse(packageJson).scripts.build, "next build");
});
