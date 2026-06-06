import { useEffect } from "react";

export function useAutoSlide(setter, slideCount, intervalMs = 5000) {
  useEffect(() => {
    const timer = window.setInterval(() => {
      setter((prev) => (prev + 1) % slideCount);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, setter, slideCount]);
}
