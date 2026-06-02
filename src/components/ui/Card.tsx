import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}

export function Card({ children, className = "", as = "div" }: CardProps) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-card border border-brand-soft bg-surface-soft p-6 ${className}`}
    >
      {children}
    </Tag>
  );
}
