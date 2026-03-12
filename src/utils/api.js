export const API_BASE =
    process.env.NODE_ENV === "production"
        ? process.env.REACT_APP_API || ""
        : "http://localhost:4321";

export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("epr_token");
    const isFormData = options.isFormData || options.body instanceof FormData;
    const headers = {
        // Don't set Content-Type for FormData — browser sets it with the correct boundary
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };
    const { isFormData: _removed, ...fetchOptions } = options;
    return fetch(`${API_BASE}${endpoint}`, {
        credentials: "include",
        ...fetchOptions,
        headers,
    });
}
