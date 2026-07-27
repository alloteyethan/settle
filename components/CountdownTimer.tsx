"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

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
    <div className={`p-4 rounded-xl border flex items-center justify-between ${
      isExpired
        ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
        : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${isExpired ? "bg-amber-500/20" : "bg-cyan-500/20"}`}>
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs uppercase font-bold tracking-wider opacity-80">
            {isExpired ? "Escrow Auto-Settling" : "Escrow Window Remaining"}
          </h4>
          <p className="text-xs text-slate-300">
            {isExpired
              ? "Window expired — funds auto-settling to seller."
              : "Auto-releases to seller if buyer does not dispute before timer ends."}
          </p>
        </div>
      </div>

      {timeLeft && (
        <div className="flex items-center space-x-1 font-mono text-xl font-bold tracking-tight">
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <span>:</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          <span>:</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}
