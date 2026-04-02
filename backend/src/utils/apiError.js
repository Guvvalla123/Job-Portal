class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {Array<{ field?: string; message: string }>} [errors]
   * @param {string | null} [code]
   */
  constructor(statusCode, message, errors = [], code = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = Array.isArray(errors) ? errors : [];
    this.code = code;
    this.name = "ApiError";
  }
}

module.exports = { ApiError };
