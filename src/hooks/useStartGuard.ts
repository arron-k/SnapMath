"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/AuthProvider";
import { useChildrenContext } from "@/components/providers/ChildrenProvider";

export function useStartGuard(): () => boolean {
  const router = useRouter();
  const { user, configured } = useUser();
  const { profiles, loading } = useChildrenContext();

  return useCallback((): boolean => {
    if (!configured) return true;
    if (!user) {
      router.push("/login?mode=signup&next=/");
      return false;
    }
    if (!loading && profiles.length === 0) {
      router.push("/children");
      return false;
    }
    return true;
  }, [configured, user, loading, profiles.length, router]);
}
