/**
 * services/ApiError.js
 * ─────────────────────
 * Normalized error type for the whole app. Every rejected request from the
 * HTTP client is converted into an ApiError so UI code can rely on a single
 * shape: `error.message` is always a human-readable string.
 */
export class ApiError extends Error {
  constructor({ message, status = null, code = null, details = null, isNetwork = false }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.isNetwork = isNetwork;
  }

  /** Build an ApiError from an axios error, unwrapping the backend's shape. */
  static fromAxios(error) {
    // No response → network/timeout failure.
    if (!error.response) {
      const timedOut = error.code === "ECONNABORTED";
      return new ApiError({
        message: timedOut
          ? "The request timed out. Check your connection and try again."
          : "Can't reach the server. Make sure you're online and the API is running.",
        code: error.code || "NETWORK_ERROR",
        isNetwork: true,
      });
    }

    const { status, data } = error.response;
    let message = "Something went wrong. Please try again.";
    let details = null;

    if (data && typeof data === "object") {
      // FastAPI shapes: { detail: "..."} | { detail: [...] } | { errors: [...] }
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.errors) && data.errors.length) {
        message = data.errors[0]?.message || message;
        details = data.errors;
      } else if (Array.isArray(data.detail) && data.detail.length) {
        message = data.detail[0]?.msg || message;
        details = data.detail;
      }
      return new ApiError({ message, status, code: data.code || null, details });
    }

    return new ApiError({ message, status });
  }
}

export default ApiError;
