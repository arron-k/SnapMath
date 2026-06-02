"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/AuthProvider";
import { useChildStore } from "@/stores/childStore";
import type { ChildProfileRow } from "@/types/database";

export interface NewChildInput {
  nickname: string;
  grade: number;
  semester: number;
  consent: boolean;
}

interface ChildrenContextValue {
  profiles: ChildProfileRow[];
  activeChild: ChildProfileRow | null;
  activeChildId: string | null;
  setActiveChild: (id: string | null) => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createProfile: (input: NewChildInput) => Promise<ChildProfileRow | null>;
  switcherOpen: boolean;
  openSwitcher: () => void;
  closeSwitcher: () => void;
}

const ChildrenContext = createContext<ChildrenContextValue | null>(null);

export function ChildrenProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { activeChildId, setActiveChild } = useChildStore();
  const [profiles, setProfiles] = useState<ChildProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase || !user) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from("child_profiles")
      .select("*")
      .order("created_at", { ascending: true });
    if (err) setError(err.message);
    else setProfiles(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  useEffect(() => {
    if (profiles.length === 0) return;
    const stillValid = profiles.some((p) => p.id === activeChildId);
    if (!stillValid) setActiveChild(profiles[0].id);
  }, [profiles, activeChildId, setActiveChild]);

  const createProfile = useCallback(
    async (input: NewChildInput): Promise<ChildProfileRow | null> => {
      const supabase = getBrowserSupabase();
      if (!supabase || !user) return null;
      const { data, error: err } = await supabase
        .from("child_profiles")
        .insert({
          parent_id: user.id,
          nickname: input.nickname.trim(),
          grade: input.grade,
          semester: input.semester,
          consent_at: input.consent ? new Date().toISOString() : null,
        })
        .select("*")
        .single();
      if (err) {
        setError(err.message);
        return null;
      }
      setProfiles((prev) => [...prev, data]);
      setActiveChild(data.id);
      return data;
    },
    [user, setActiveChild],
  );

  const activeChild =
    profiles.find((p) => p.id === activeChildId) ?? profiles[0] ?? null;

  const openSwitcher = useCallback(() => setSwitcherOpen(true), []);
  const closeSwitcher = useCallback(() => setSwitcherOpen(false), []);

  return (
    <ChildrenContext.Provider
      value={{
        profiles,
        activeChild,
        activeChildId: activeChild?.id ?? null,
        setActiveChild,
        loading,
        error,
        refresh,
        createProfile,
        switcherOpen,
        openSwitcher,
        closeSwitcher,
      }}
    >
      {children}
    </ChildrenContext.Provider>
  );
}

export function useChildrenContext(): ChildrenContextValue {
  const ctx = useContext(ChildrenContext);
  if (!ctx) {
    throw new Error("useChildrenContext must be used within ChildrenProvider");
  }
  return ctx;
}
