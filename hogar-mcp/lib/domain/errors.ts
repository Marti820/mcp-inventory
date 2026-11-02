/**
 * Error de regla de negocio. El mensaje está pensado para el asistente y se
 * le devuelve tal cual; cualquier otro error se registra y se oculta.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
