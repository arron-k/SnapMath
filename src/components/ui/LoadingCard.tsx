import { Card } from "@/components/ui/Card";
import { LoadingDots } from "@/components/ui/LoadingDots";

export function LoadingCard({ message }: { message: string }) {
  return (
    <Card className="flex flex-col items-center gap-4 py-10">
      <span className="text-4xl" role="img" aria-label="스냅이">
        🦊
      </span>
      <LoadingDots />
      <p className="text-lg font-medium text-ink">{message}</p>
    </Card>
  );
}
