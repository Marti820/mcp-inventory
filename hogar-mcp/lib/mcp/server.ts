import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { DomainError } from "@/lib/domain/errors";
import { addNote, listNotes } from "@/lib/domain/notes";
import { listUsers, type User } from "@/lib/domain/users";

const INSTRUCTIONS = `
Servidor del hogar compartido (alacena, facturas y gastos). Fase actual: prueba 0.

- La persona conectada la determina la URL del conector. No preguntes quién es
  ni le pidas que lo diga; si necesitas su nombre, usa whoami.
- Lo que escribe una persona lo ve la otra desde su propio asistente.
`.trim();

/**
 * Construye un servidor MCP atado a un usuario. Cada petición HTTP crea el
 * suyo (modo sin estado), así que el usuario nunca viaja como parámetro.
 */
export function buildServer(user: User): McpServer {
  const server = new McpServer(
    { name: "hogar-mcp", version: "0.1.0" },
    { instructions: INSTRUCTIONS },
  );

  server.registerTool(
    "whoami",
    {
      title: "Quién soy",
      description: "Devuelve con qué usuario está conectado este asistente y quién más vive en el hogar.",
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    () =>
      run(async () => {
        const members = await listUsers();
        const others = members.filter((m) => m.id !== user.id).map((m) => m.name);
        return `Conectado como ${user.name}. Resto del hogar: ${others.join(", ") || "(nadie más todavía)"}.`;
      }),
  );

  server.registerTool(
    "leave_note",
    {
      title: "Dejar nota",
      description:
        "Deja una nota para el hogar, firmada con el usuario conectado. Sirve para comprobar que lo que escribe uno lo lee el otro.",
      inputSchema: {
        text: z.string().min(1).max(2000).describe("Texto de la nota"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    ({ text }) =>
      run(async () => {
        const note = await addNote(user, text);
        return `Nota #${note.id} guardada como ${note.author}.`;
      }),
  );

  server.registerTool(
    "read_notes",
    {
      title: "Leer notas",
      description: "Lista las notas del hogar, de la más reciente a la más antigua, con su autor.",
      inputSchema: {
        limit: z.number().int().min(1).max(50).default(20).describe("Cuántas notas devolver"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ limit }) =>
      run(async () => {
        const notes = await listNotes(limit);
        if (notes.length === 0) return "No hay notas todavía.";
        return notes
          .map((n) => `#${n.id} · ${n.author} · ${formatDate(n.createdAt)}\n${n.body}`)
          .join("\n\n");
      }),
  );

  return server;
}

/** Envuelve un handler: los DomainError llegan al asistente, el resto se oculta. */
async function run(fn: () => Promise<string>): Promise<CallToolResult> {
  try {
    return { content: [{ type: "text", text: await fn() }] };
  } catch (err) {
    if (err instanceof DomainError) {
      return { isError: true, content: [{ type: "text", text: err.message }] };
    }
    console.error("[hogar-mcp] error en tool:", err);
    return { isError: true, content: [{ type: "text", text: "Error interno del servidor. Inténtalo de nuevo." }] };
  }
}

const dateFormat = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Paris",
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(d: Date): string {
  return dateFormat.format(d);
}
