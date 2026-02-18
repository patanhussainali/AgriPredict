// config.js
// Logic: Use VITE_API_URL if set (production), otherwise default to local backend.
// On Vercel, requests to /api/... will be rewritten to the backend.
// But for a separate backend deployment or if we want explicit control:

// In production (Vercel), use relative path to avoid CORS and configuration issues.
// Requests to /api/... will be handled by vercel.json routes.
const API_URL = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:8000");

export default API_URL;
