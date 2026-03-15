export class AppError extends Error {
  constructor({ name, message, code, action, cause } = {}) {
    super(message || 'An error has occurred', { cause })
    this.name = name || 'AppError'
    this.code = code || 'APP_ERROR'
    this.action = action
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      action: this.action
    }
  }
}

export class ValidationError extends AppError {
  constructor({ name, message, code, action, cause } = {}) {
    super({
      name: name || 'ValidationError',
      message: message || 'A Validation Error has occurred',
      code: code || 'VALIDATION_ERROR',
      action: action || 'Check the submitted data and try again',
      cause
    })
  }
}

export class NotFoundError extends AppError {
  constructor({ name, message, code, action, cause } = {}) {
    super({
      name: name || 'NotFoundError',
      message: message || 'The requested resource was not found',
      code: code || 'NOT_FOUND',
      action: action || 'Check the provided identifier and try again',
      cause
    })
  }
}

export class FatalError extends AppError {
  constructor({ name, message, code, action, cause } = {}) {
    super({
      name: name || 'FatalError',
      message: message || 'A fatal error has occurred',
      code: code || 'FATAL_ERROR',
      action: action || 'Restart the application',
      cause
    })
  }
}
