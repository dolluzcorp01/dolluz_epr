export const API_BASE =
    process.env.NODE_ENV === "production"
        ? process.env.REACT_APP_API || ""
        : "http://localhost:4321";

export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("epr_token");
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };
    return fetch(`${API_BASE}${endpoint}`, {
        credentials: "include",
        ...options,
        headers,
    });
}
