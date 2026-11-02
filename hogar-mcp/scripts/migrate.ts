/**
 * Aplica en orden las migraciones de db/migrations que falten.
 * Uso: npm run db:migrate   (lee DATABASE_URL de .env.local)
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../lib/db";

async function main() {
  const sql = db();
  const dir = path.resolve("db/migrations");

  await sql`
    create table if not exists schema_migrations (
      name        text primary key,
      applied_at  timestamptz not null default now()
    )
  `;
  await sql`alter table schema_migrations enable row level security`;

  const applied = new Set(
    (await sql<{ name: string }[]>`select name from schema_migrations`).map((r) => r.name),
  );
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log("La base ya está al día.");
  }
  for (const file of pending) {
    const body = await readFile(path.join(dir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into schema_migrations (name) values (${file})`;
    });
    console.log(`✔ ${file}`);
  }

  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
