import logger from "./logger.js";

export function handleError(res, err, defaultMessage) {
  logger.error(defaultMessage, {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
  });
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || defaultMessage });
}

export function serviceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function validationError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
