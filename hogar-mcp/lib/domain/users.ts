import { db } from "@/lib/db";
import { hashToken, looksLikeToken } from "@/lib/auth";

export type User = { id: number; name: string };

export async function findUserByToken(token: string): Promise<User | null> {
  if (!looksLikeToken(token)) return null;
  const rows = await db()<User[]>`
    select id, name from users where token_hash = ${hashToken(token)}
  `;
  return rows[0] ?? null;
}

export async function listUsers(): Promise<User[]> {
  return db()<User[]>`select id, name from users order by id`;
}
