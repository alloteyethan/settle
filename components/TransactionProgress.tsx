import { CheckCircle2, Lock, Truck, DollarSign, AlertTriangle } from "lucide-react";

interface Step {
  id: string;
  name: string;
  description: string;
}

const steps: Step[] = [
  { id: "created", name: "Link Created", description: "Waiting for buyer payment" },
  { id: "locked", name: "Payment Locked", description: "Funds secured in escrow" },
  { id: "dispatched", name: "Dispatched", description: "Seller shipped / fulfilled" },
  { id: "settled", name: "Settled", description: "Delivery confirmed & payout released" },
];

export function TransactionProgress({ status }: { status: string }) {
  const getStepState = (stepId: string) => {
    if (status === "disputed") {
      if (stepId === "created" || stepId === "locked") return "complete";
      return "disputed";
    }

    const order = ["created", "locked", "dispatched", "settled"];
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(stepId);

    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  return (
    <div className="w-full py-4">
      {status === "disputed" && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-rose-300">Transaction Disputed</h4>
            <p className="text-xs text-rose-200/80 mt-0.5">
              Escrow payout frozen. Support team reviewing buyer evidence and seller counter-proof.
            </p>
          </div>
        </div>
      )}

      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
        {/* Horizontal Line for Desktop */}
        <div className="hidden md:block absolute left-8 right-8 top-5 h-0.5 bg-slate-800 -z-0" />

        {steps.map((step, idx) => {
          const state = getStepState(step.id);
          const isComplete = state === "complete";
          const isCurrent = state === "current";
          const isDisputed = state === "disputed";

          return (
            <div key={step.id} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center group">
              {/* Icon Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isComplete
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 ring-4 ring-slate-950"
                    : isCurrent
                    ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/40 ring-4 ring-cyan-500/20 animate-pulse"
                    : isDisputed
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-4 ring-slate-950"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                ) : step.id === "created" ? (
                  <span>1</span>
                ) : step.id === "locked" ? (
                  <Lock className="w-4 h-4" />
                ) : step.id === "dispatched" ? (
                  <Truck className="w-4 h-4" />
                ) : (
                  <DollarSign className="w-4 h-4" />
                )}
              </div>

              {/* Step Text */}
              <div className="flex flex-col">
                <span
                  className={`text-sm font-bold ${
                    isComplete
                      ? "text-emerald-400"
                      : isCurrent
                      ? "text-cyan-400"
                      : isDisputed
                      ? "text-rose-400"
                      : "text-slate-400"
                  }`}
                >
                  {step.name}
                </span>
                <span className="text-[11px] text-slate-400 max-w-[140px] leading-tight mt-0.5">
                  {step.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
