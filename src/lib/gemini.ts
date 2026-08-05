// src/lib/gemini.ts
import { GoogleGenAI } from '@google/genai';

// Memastikan API Key sudah terpasang
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY belum dikonfigurasi di file .env.local');
}

// Inisialisasi client Gemini secara terpusat
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});