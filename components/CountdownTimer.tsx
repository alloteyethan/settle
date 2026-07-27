"use client";

import { useEffect, useState } from "react";

export function CountdownTimer({ deadline }: { deadline: string | null }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!deadline) return;

    const target = new Date(deadline).getTime();

    const calculate = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) return null;

  return (
    <div className="p-3.5 rounded-lg bg-[#E7ECF1] border border-[#3E5C76]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-[#3E5C76]">
      <div>
        <span className="font-semibold block">
          {isExpired ? "Escrow Window Expired" : "Escrow Window Remaining"}
        </span>
        <span className="text-[11px] opacity-80 leading-normal block">
          {isExpired
            ? "Delivery window completed — auto-releasing funds to seller."
            : "Funds auto-release to seller if no dispute is raised before timer ends."}
        </span>
      </div>

      {timeLeft && (
        <div className="font-mono text-xs sm:text-sm font-semibold tracking-wider bg-white px-2.5 py-1 rounded border border-[#E4DDCB] shrink-0 self-start sm:self-auto">
          {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
        </div>
      )}
    </div>
  );
}
