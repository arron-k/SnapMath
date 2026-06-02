import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChildState {
  activeChildId: string | null;
  setActiveChild: (id: string | null) => void;
}

export const useChildStore = create<ChildState>()(
  persist(
    (set) => ({
      activeChildId: null,
      setActiveChild: (id) => set({ activeChildId: id }),
    }),
    { name: "snapmath-active-child" },
  ),
);
