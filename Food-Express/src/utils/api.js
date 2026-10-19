const TOKEN_KEY = "food-express-access-token";
const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const getAccessToken = () => window.localStorage.getItem(TOKEN_KEY);

export const setAccessToken = (token) => {
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
};

export const apiRequest = async (path, options = {}) => {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...(options.body && typeof options.body !== "string"
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    throw new ApiError(
      payload?.error || "The request could not be completed.",
      response.status,
    );
  }
  return payload;
};
