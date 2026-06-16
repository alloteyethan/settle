import { useState, useEffect } from "react";
import { Clock, CheckCircle2 } from "lucide-react";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function getTimeLeft(deadline: string): TimeLeft | null {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return null;
  return {
    hours: Math.floor(ms / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
    totalMs: ms,
  };
}

interface CountdownTimerProps {
  deadline: string;
  totalHours: number;
  compact?: boolean;
}

export function CountdownTimer({ deadline, totalHours, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => getTimeLeft(deadline));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2 text-emerald-600">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span className="text-sm font-medium">Auto-release triggered</span>
      </div>
    );
  }

  const totalMs = totalHours * 3600000;
  const elapsed = totalMs - timeLeft.totalMs;
  const pct = Math.min(100, Math.max(0, (elapsed / totalMs) * 100));

  const pad = (n: number) => String(n).padStart(2, "0");

  if (compact) {
    return (
      <span className="font-mono text-sm font-semibold tabular-nums text-amber-700">
        {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
          <span className="font-mono text-base font-bold tabular-nums text-amber-800">
            {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
          </span>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">until auto-release</span>
      </div>
      <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Funds release automatically when the timer ends if no dispute is raised
      </p>
    </div>
  );
}
