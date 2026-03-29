import { create } from "zustand";
import { fetchWithAuth } from "@/lib/api-client";

interface AppState {
  selectedModel: string;
  isInitialized: boolean;
  isLoggedIn: boolean;
  initStore: () => Promise<void>;
  setModel: (model: string) => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  selectedModel: "gemini-2.5-flash",
  isInitialized: false,
  isLoggedIn: false,
  login: async () => {
    sessionStorage.setItem("isLoggedIn", "true");
    set({ isLoggedIn: true });

    try {
      const res = await fetchWithAuth("/api/user/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.selectedModel) {
          set({ selectedModel: data.selectedModel, isInitialized: true });
          return;
        }
      }
    } catch (error) {
      console.error("Failed to login and fetch settings:", error);
    }
  },
  logout: async () => {
    try {
      // Use standard fetch here to avoid recursion if logout itself fails with 401
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Failed to logout on server:", err);
    }
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("selectedModel");
    set({ isLoggedIn: false, selectedModel: "" });
  },

  initStore: async () => {
    try {
      const loggedIn = sessionStorage.getItem("isLoggedIn") === "true";
      if (loggedIn) {
        set({ isLoggedIn: true });
      }
      set({ isInitialized: true });
    } catch (error) {
      console.error("Failed to initialize store:", error);
    }
    set({ isInitialized: true });
  },
  setModel: async (model: string) => {
    set({ selectedModel: model });
    try {
      await fetchWithAuth("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedModel: model }),
      });
    } catch (error) {
      console.error("Failed to save selected model:", error);
    }
  },
}));
