export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Não autenticado") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Acesso negado") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Não encontrado") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Conflito") {
    super(409, "CONFLICT", message);
  }
}

export class ValidationError extends HttpError {
  constructor(
    message = "Dados inválidos",
    public details?: unknown,
  ) {
    super(422, "VALIDATION_ERROR", message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Requisição inválida") {
    super(400, "BAD_REQUEST", message);
  }
}
