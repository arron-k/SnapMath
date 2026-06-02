"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/AuthProvider";
import type { LearningHistoryRow } from "@/types/database";

export interface UnitStat {
  unit: string;
  total: number;
  wrong: number;
  lastAt: string;
}

export interface HistorySummary {
  total: number;
  correct: number;
  correctRate: number;
  activeDays: number;
  wrongUnits: UnitStat[];
}

function summarize(rows: LearningHistoryRow[]): HistorySummary {
  const total = rows.length;
  const correct = rows.filter((r) => r.is_correct).length;

  const byUnit = new Map<string, UnitStat>();
  for (const r of rows) {
    const unit = r.unit ?? "기타";
    const cur = byUnit.get(unit) ?? { unit, total: 0, wrong: 0, lastAt: r.created_at };
    cur.total += 1;
    if (r.is_correct === false) cur.wrong += 1;
    if (r.created_at > cur.lastAt) cur.lastAt = r.created_at;
    byUnit.set(unit, cur);
  }

  const days = new Set(rows.map((r) => r.created_at.slice(0, 10)));

  return {
    total,
    correct,
    correctRate: total === 0 ? 0 : Math.round((correct / total) * 100),
    activeDays: days.size,
    wrongUnits: [...byUnit.values()]
      .filter((u) => u.wrong > 0)
      .sort((a, b) => b.wrong - a.wrong),
  };
}

export function useLearningHistory(childProfileId: string | null) {
  const { user } = useUser();
  const [rows, setRows] = useState<LearningHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase || !user || !childProfileId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("learning_history")
      .select("*")
      .eq("child_profile_id", childProfileId)
      .order("created_at", { ascending: false })
      .limit(200);
    setRows(data ?? []);
    setLoading(false);
  }, [user, childProfileId]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  const summary = useMemo(() => summarize(rows), [rows]);

  return { rows, summary, loading, refresh };
}
