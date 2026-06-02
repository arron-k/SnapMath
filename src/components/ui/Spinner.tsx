import { Loader2 } from "lucide-react";

export function Spinner({
  label = "불러오는 중",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span role="status" aria-live="polite" className={className}>
      <Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
