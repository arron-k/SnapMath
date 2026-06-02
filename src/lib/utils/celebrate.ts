import confetti from "canvas-confetti";

export function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 38,
    origin: { y: 0.7 },
    colors: ["#3B82F6", "#FCD34D", "#34D399", "#A78BFA"],
  });
}
