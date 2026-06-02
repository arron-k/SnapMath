"use client";

import { useEffect, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { useThemeStore } from "@/stores/themeStore";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ChildrenProvider } from "@/components/providers/ChildrenProvider";
import { LearnerSwitcher } from "@/components/learner/LearnerSwitcher";

export function Providers({ children }: { children: ReactNode }) {
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ChildrenProvider>
          {children}
          <LearnerSwitcher />
        </ChildrenProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
