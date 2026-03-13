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
    const res = await fetch(`${API_BASE}${endpoint}`, {
        credentials: "include",
        ...fetchOptions,
        headers,
    });
    // If token is missing, expired or invalid — fire a global event so the
    // app can redirect to login without each caller needing to handle it.
    if (res.status === 401) {
        localStorage.removeItem("epr_token");
        window.dispatchEvent(new CustomEvent("epr:unauthorized"));
    }
    return res;
}