/**
 * HoldingVision Pro — Brand Store
 * Stores brand identity (logo, colors, name) and applies them as CSS variables.
 * Double persistence: localStorage (instant) + Supabase user_brand table (cross-device).
 * On login, Supabase brand is loaded and applied automatically.
 */
import { create } from "zustand";
import { supabase } from "../lib/supabase.js";

const STORAGE_KEY = "hvp_brand";

// ─── LocalStorage helpers ────────────────────────

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocal(brand) {
  try {
    if (brand) localStorage.setItem(STORAGE_KEY, JSON.stringify(brand));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ─── Supabase helpers ────────────────────────────

async function loadFromSupabase(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from("user_brand")
      .select("brand_data")
      .eq("user_id", userId)
      .single();
    if (error || !data) return null;
    return data.brand_data;
  } catch { return null; }
}

async function saveToSupabase(userId, brand) {
  if (!userId) return;
  try {
    await supabase
      .from("user_brand")
      .upsert({
        user_id: userId,
        brand_data: brand,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
  } catch (e) {
    console.warn("Brand save to Supabase failed:", e.message);
  }
}

async function deleteFromSupabase(userId) {
  if (!userId) return;
  try {
    await supabase
      .from("user_brand")
      .delete()
      .eq("user_id", userId);
  } catch {}
}

// ─── Color utilities ─────────────────────────────

function hexToRgb(hex) {
  if (!hex || hex.length < 7) return { r: 200, g: 150, b: 80 };
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function darken(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  return `#${Math.round(r * f).toString(16).padStart(2, "0")}${Math.round(g * f).toString(16).padStart(2, "0")}${Math.round(b * f).toString(16).padStart(2, "0")}`;
}

function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Apply brand to CSS :root ────────────────────

function applyBrandToCSS(brand) {
  if (!brand?.colors?.primary) return;

  const root = document.documentElement;
  const p = brand.colors.primary;
  const s = brand.colors.secondary || p;

  root.style.setProperty("--copper", p);
  root.style.setProperty("--copper-bright", s);
  root.style.setProperty("--copper-dim", darken(p, 0.3));
  root.style.setProperty("--copper-muted", darken(p, 0.5));
  root.style.setProperty("--gold-glow", withAlpha(p, 0.15));
  root.style.setProperty("--orange-accent", s);
  root.style.setProperty("--node-border-sel", withAlpha(p, 0.6));
  root.style.setProperty("--flow-particle", p);
  root.style.setProperty("--border-hover", withAlpha(p, 0.2));
  root.style.setProperty("--border-active", withAlpha(p, 0.4));
  root.style.setProperty("--glass-border", withAlpha(p, 0.08));
  root.style.setProperty("--shadow-glow", `0 0 20px ${withAlpha(p, 0.08)}`);
  root.style.setProperty("--gold", p);
  root.style.setProperty("--gold-bright", s);
  root.style.setProperty("--gold-dim", darken(p, 0.3));
  root.style.setProperty("--accent", p);
  root.style.setProperty("--brd-light", withAlpha(p, 0.2));
  root.style.setProperty("--brd-gold", withAlpha(p, 0.4));
}

function resetBrandCSS() {
  const root = document.documentElement;
  const props = [
    "--copper", "--copper-bright", "--copper-dim", "--copper-muted",
    "--gold-glow", "--orange-accent", "--node-border-sel", "--flow-particle",
    "--border-hover", "--border-active", "--glass-border", "--shadow-glow",
    "--gold", "--gold-bright", "--gold-dim", "--accent", "--brd-light", "--brd-gold",
  ];
  props.forEach(p => root.style.removeProperty(p));
}

// ─── Store ───────────────────────────────────────

const useBrandStore = create((set, get) => ({
  brand: loadLocal(),
  isWhiteLabel: !!loadLocal(),
  loading: false,

  setBrand: async (brand, userId) => {
    saveLocal(brand);
    applyBrandToCSS(brand);
    set({ brand, isWhiteLabel: true });
    if (userId) saveToSupabase(userId, brand);
  },

  clearBrand: async (userId) => {
    saveLocal(null);
    resetBrandCSS();
    set({ brand: null, isWhiteLabel: false });
    if (userId) deleteFromSupabase(userId);
  },

  // Init: apply local instantly, then sync from Supabase
  init: async (userId) => {
    set({ loading: true });
    const local = loadLocal();
    if (local) {
      applyBrandToCSS(local);
      set({ brand: local, isWhiteLabel: true });
    }
    if (userId) {
      const remote = await loadFromSupabase(userId);
      if (remote) {
        saveLocal(remote);
        applyBrandToCSS(remote);
        set({ brand: remote, isWhiteLabel: true, loading: false });
      } else if (local) {
        saveToSupabase(userId, local);
        set({ loading: false });
      } else {
        set({ loading: false });
      }
    } else {
      set({ loading: false });
    }
  },

  getDisplayName: () => get().brand?.name || "HoldingVision Pro",
  getLogoUrl: () => get().brand?.logo || null,
  getPrimaryColor: () => get().brand?.colors?.primary || "#c89650",
  getSecondaryColor: () => get().brand?.colors?.secondary || "#e89040",
}));

export default useBrandStore;
