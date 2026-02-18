export class AppError extends Error {
  constructor({ name, message, code, details, action, statusCode, cause } = {}) {
    super(message || 'An error has occurred', { cause })
    this.name = name || 'AppError'
    this.code = code || 'APP_ERROR'
    this.details = details
    this.action = action
    this.statusCode = statusCode || 500
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      action: this.action,
      status_code: this.statusCode
    }
  }
}

export class ValidationError extends AppError {
  constructor({ cause, message, action, code } = {}) {
    super({
      name: 'ValidationError',
      message: message || 'A Validation Error has occurred',
      code: code || 'VALIDATION_ERROR',
      details: cause,
      action: action || 'Check the submitted data and try again',
      statusCode: 400,
      cause
    })
  }
}

export class NotFoundError extends AppError {
  constructor({ message, details, action, cause } = {}) {
    super({
      name: 'NotFoundError',
      message: message || 'The requested resource was not found',
      code: 'NOT_FOUND',
      details,
      action: action || 'Check the provided identifier and try again',
      statusCode: 404,
      cause
    })
  }
}

export class FatalError extends AppError {
  constructor({ message, details, cause } = {}) {
    super({
      name: 'FatalError',
      message: message || 'A fatal error has occurred',
      code: 'FATAL_ERROR',
      details,
      action: 'Restart the application',
      statusCode: 500,
      cause
    })
  }
}
