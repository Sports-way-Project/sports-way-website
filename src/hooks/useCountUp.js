import { useEffect, useState } from "react";

export function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const totalFrames = Math.max(1, Math.round(duration / 16));
    const increment = target / totalFrames;
    const timer = window.setInterval(() => {
      start += increment;
      if (start >= target) {
        setValue(target);
        window.clearInterval(timer);
        return;
      }

      setValue(Math.floor(start));
    }, 16);

    return () => window.clearInterval(timer);
  }, [duration, target]);

  return value.toLocaleString();
}
