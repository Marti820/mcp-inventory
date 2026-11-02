import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { findUserByToken } from "@/lib/domain/users";
import { buildServer } from "@/lib/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

/**
 * Punto de entrada MCP: https://<app>/mcp/<token>
 * El token identifica a la persona. Un token inválido responde 404, sin
 * pistas, y no dispara flujos OAuth en el cliente.
 */
export async function POST(req: Request, { params }: Ctx): Promise<Response> {
  const { token } = await params;
  try {
    const user = await findUserByToken(token);
    if (!user) return notFound();

    const server = buildServer(user);
    // Sin sessionIdGenerator = modo sin estado; respuestas JSON en vez de SSE,
    // que es lo que mejor encaja con funciones serverless.
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    return await transport.handleRequest(req);
  } catch (err) {
    console.error("[hogar-mcp] error en la petición:", err);
    return Response.json(
      { jsonrpc: "2.0", error: { code: -32603, message: "Error interno del servidor" }, id: null },
      { status: 500 },
    );
  }
}

/** Sin sesiones ni stream SSE de servidor: GET y DELETE no aplican (spec MCP). */
async function methodNotAllowed(_req: Request, { params }: Ctx): Promise<Response> {
  const { token } = await params;
  const user = await findUserByToken(token).catch(() => null);
  if (!user) return notFound();
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}

export { methodNotAllowed as GET, methodNotAllowed as DELETE };

function notFound(): Response {
  return new Response("Not Found", { status: 404 });
}
