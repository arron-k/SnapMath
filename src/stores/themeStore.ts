import { create } from "zustand";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "snapmath-theme";

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(pref: ThemePreference): "light" | "dark" {
  return pref === "system" ? (systemPrefersDark() ? "dark" : "light") : pref;
}

function applyToDocument(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

interface ThemeState {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (pref: ThemePreference) => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: "system",
  resolved: "light",
  setPreference: (pref) => {
    const resolved = resolve(pref);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, pref);
    }
    applyToDocument(resolved);
    set({ preference: pref, resolved });
  },
  initTheme: () => {
    const stored =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null)
        : null;
    const pref = stored ?? "system";
    const resolved = resolve(pref);
    applyToDocument(resolved);
    set({ preference: pref, resolved });

    if (typeof window !== "undefined") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      mql.addEventListener("change", () => {
        if (get().preference !== "system") return;
        const next = systemPrefersDark() ? "dark" : "light";
        applyToDocument(next);
        set({ resolved: next });
      });
    }
  },
}));
