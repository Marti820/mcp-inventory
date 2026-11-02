import { db } from "@/lib/db";
import { DomainError } from "@/lib/domain/errors";
import type { User } from "@/lib/domain/users";

export type Note = { id: number; author: string; body: string; createdAt: Date };

export async function addNote(author: User, body: string): Promise<Note> {
  const text = body.trim();
  if (!text) throw new DomainError("La nota está vacía.");
  if (text.length > 2000) throw new DomainError("La nota pasa de 2000 caracteres.");

  const [row] = await db()<{ id: number; createdAt: Date }[]>`
    insert into notes (author_id, body)
    values (${author.id}, ${text})
    returning id, created_at as "createdAt"
  `;
  return { id: row!.id, author: author.name, body: text, createdAt: row!.createdAt };
}

export async function listNotes(limit = 20): Promise<Note[]> {
  return db()<Note[]>`
    select n.id, u.name as author, n.body, n.created_at as "createdAt"
    from notes n join users u on u.id = n.author_id
    order by n.created_at desc, n.id desc
    limit ${limit}
  `;
}
