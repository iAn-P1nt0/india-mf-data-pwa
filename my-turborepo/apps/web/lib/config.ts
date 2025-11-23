export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? "https://india-mf-data-pwa.onrender.com"
    : "http://localhost:3001");

export const SEBI_DISCLAIMER =
  "Mutual fund investments are subject to market risks. Read all scheme related documents carefully. Historical performance is not an indicator of future returns.";

export const FUNDS_CACHE_KEY = "funds";
