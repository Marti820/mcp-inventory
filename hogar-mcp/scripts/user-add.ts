/**
 * Crea un usuario o le rota el token, e imprime su URL de conector.
 * Uso: npm run user:add -- martin
 *
 * El token solo se muestra una vez: en la base se guarda su hash.
 * Volver a ejecutarlo con el mismo nombre invalida la URL anterior.
 */
import { db } from "../lib/db";
import { generateToken, hashToken } from "../lib/auth";

async function main() {
  const name = process.argv[2]?.trim().toLowerCase();
  if (!name || !/^[a-z][a-z0-9_-]{1,31}$/.test(name)) {
    console.error("Uso: npm run user:add -- <nombre>   (minúsculas, p. ej. martin)");
    process.exit(1);
  }

  const sql = db();
  const token = generateToken();
  const [row] = await sql<{ created: boolean }[]>`
    insert into users (name, token_hash)
    values (${name}, ${hashToken(token)})
    on conflict (name) do update set token_hash = excluded.token_hash
    returning (xmax = 0) as created
  `;
  await sql.end();

  const base = (process.env.APP_URL ?? "https://<tu-app>.vercel.app").replace(/\/+$/, "");
  console.log(row?.created ? `Usuario "${name}" creado.` : `Token de "${name}" rotado; la URL anterior ya no sirve.`);
  console.log(`\nURL del conector (trátala como una contraseña):\n\n  ${base}/mcp/${token}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
