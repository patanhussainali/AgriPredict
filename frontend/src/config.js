// config.js
// In development: Vite proxy forwards /predict, /chat, /auth → localhost:8000
// In production (Vercel): requests go to /api/... and Vercel rewrites handle it

const API_URL = import.meta.env.VITE_API_URL || "";

export default API_URL;
