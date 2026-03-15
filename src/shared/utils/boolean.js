import { ValidationError } from 'shared/errors.js'

/**
 * Parses and validates a boolean-like value
 * @param {*} value - The value to parse (boolean, 0, 1, "0", "1")
 * @param {string} fieldName - Name of the field for error messages
 * @returns {boolean} - Always returns true or false
 * @throws {ValidationError} - If value cannot be interpreted as boolean
 */
function parse(value, fieldName = 'value') {
  if (typeof value === 'boolean') {
    return value
  }

  if (value === 0 || value === '0') {
    return false
  }

  if (value === 1 || value === '1') {
    return true
  }

  throw new ValidationError({
    message: `${fieldName} has an invalid boolean value`,
    code: 'INVALID_BOOLEAN_VALUE',
    cause: [`${fieldName} must be a boolean, 0, or 1 not \`${typeof value}\``],
    action: `Provide true, false, 0, or 1 for ${fieldName}`
  })
}

function parseToDBValue(value, fieldName = 'value') {
  const parsedBool = parse(value, fieldName)
  return parsedBool ? 1 : 0
}

const booleanHelper = { parseToDBValue }

export default booleanHelper
