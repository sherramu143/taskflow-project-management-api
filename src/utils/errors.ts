export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details: Record<string, any>;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details: Record<string, any> = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND', details = {}) {
    super(message, 404, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', code = 'UNAUTHORIZED', details = {}) {
    super(message, 401, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Cross-tenant access forbidden', code = 'CROSS_TENANT_FORBIDDEN', details = {}) {
    super(message, 403, code, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = {}) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', code = 'CONFLICT', details = {}) {
    super(message, 409, code, details);
  }
}
