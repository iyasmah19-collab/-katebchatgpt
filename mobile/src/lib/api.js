import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + "/api";

const client = axios.create({ baseURL: API_URL, timeout: 60000 });

// Attach token from secure store on every request
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("session_token").catch(() => null);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const setSessionToken = async (token) => {
  if (token) await SecureStore.setItemAsync("session_token", token);
  else await SecureStore.deleteItemAsync("session_token");
};

export const getSessionToken = async () => {
  try { return await SecureStore.getItemAsync("session_token"); } catch { return null; }
};

export const api = {
  me: () => client.get("/auth/me").then((r) => r.data),
  ownerUnlock: (token) => client.post("/auth/owner-unlock", { token }).then((r) => r.data),
  logout: () => client.post("/auth/logout"),
  generateContent: (data) => client.post("/generate/content", data).then((r) => r.data),
  generateHook: (data) => client.post("/generate/hook", data).then((r) => r.data),
  generateMatch: (data) => client.post("/generate/match", data).then((r) => r.data),
  saveGen: (data) => client.post("/generations", data).then((r) => r.data),
  listGen: () => client.get("/generations").then((r) => r.data),
  deleteGen: (id) => client.delete(`/generations/${id}`).then((r) => r.data),
  // History (auto-logged generations)
  listHistory: () => client.get("/history").then((r) => r.data),
  deleteHistory: (id) => client.delete(`/history/${id}`).then((r) => r.data),
  clearHistory: () => client.delete("/history").then((r) => r.data),
  // Favorite templates
  listTemplates: () => client.get("/templates").then((r) => r.data),
  createTemplate: (data) => client.post("/templates", data).then((r) => r.data),
  deleteTemplate: (id) => client.delete(`/templates/${id}`).then((r) => r.data),
  // Brand voice
  listVoices: () => client.get("/brand-voice").then((r) => r.data),
  createVoice: (data) => client.post("/brand-voice", data).then((r) => r.data),
  activateVoice: (id) => client.post(`/brand-voice/${id}/activate`).then((r) => r.data),
  deactivateVoice: () => client.post("/brand-voice/deactivate").then((r) => r.data),
  deleteVoice: (id) => client.delete(`/brand-voice/${id}`).then((r) => r.data),
  // Google Play billing
  verifyPurchase: (productId, purchaseToken) =>
    client.post("/billing/google/verify", { product_id: productId, purchase_token: purchaseToken }).then((r) => r.data),
  subscriptionStatus: () => client.get("/billing/google/status").then((r) => r.data),
};

export default client;
