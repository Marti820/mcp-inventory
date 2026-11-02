import postgres from "postgres";

declare global {
  // Evita abrir una conexión nueva en cada recarga de `next dev`.
  var __hogarSql: postgres.Sql | undefined;
}

function isLocal(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function connect(): postgres.Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL (ver .env.example)");
  return postgres(url, {
    // Obligatorio con el pooler de Supabase en modo transacción.
    prepare: false,
    ssl: isLocal(url) ? false : "require",
    // Una función serverless atiende pocas peticiones a la vez y el pooler
    // ya multiplexa: una conexión por instancia basta.
    max: 1,
    // El pooler en modo transacción no admite pipelining: una consulta a la vez.
    max_pipeline: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    // Los NOTICE de Postgres ("already exists, skipping"...) son ruido en los logs.
    onnotice: () => {},
  });
}

/** Cliente SQL perezoso: no se conecta hasta la primera consulta. */
export function db(): postgres.Sql {
  globalThis.__hogarSql ??= connect();
  return globalThis.__hogarSql;
}
