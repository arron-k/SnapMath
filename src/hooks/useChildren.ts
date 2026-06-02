"use client";

import {
  useChildrenContext,
  type NewChildInput,
} from "@/components/providers/ChildrenProvider";

export type { NewChildInput };

export function useChildren() {
  return useChildrenContext();
}
