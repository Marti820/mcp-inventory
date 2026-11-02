import { createHash, randomBytes } from "node:crypto";

/** Token de conector: 32 bytes aleatorios en base64url (43 caracteres). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** En la base solo se guarda el hash; el token en claro vive en la URL. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Descarta de entrada cualquier cosa que no tenga forma de token. */
export function looksLikeToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{32,128}$/.test(value);
}
