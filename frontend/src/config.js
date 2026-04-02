// config.js
// In development: Vite proxy forwards /predict, /chat, /auth → localhost:8000
// In production (Vercel): use /api so calls hit serverless routes (e.g. api/predict.py).
// Without this, /predict is rewritten to index.html (SPA) and JSON.parse fails on HTML.

const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "" : "/api");

export default API_URL;
