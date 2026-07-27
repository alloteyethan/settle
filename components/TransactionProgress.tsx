import { Check, AlertCircle } from "lucide-react";

interface Step {
  id: string;
  name: string;
  description: string;
}

const steps: Step[] = [
  { id: "created", name: "Deal Link Created", description: "Waiting for buyer payment" },
  { id: "locked", name: "Payment Locked", description: "Funds in escrow" },
  { id: "dispatched", name: "Item Dispatched", description: "Seller shipped / delivered" },
  { id: "settled", name: "Funds Released", description: "Payout sent to seller" },
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
    <div className="w-full py-2">
      {status === "disputed" && (
        <div className="mb-6 p-3.5 rounded-lg bg-[#F7E6E2] border border-[#A33B2E]/20 flex items-start space-x-3 text-xs text-[#A33B2E]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 stroke-[1.75]" />
          <div>
            <span className="font-semibold block">Transaction Disputed</span>
            <span className="opacity-90">Escrow payout frozen while support reviews claims and evidence.</span>
          </div>
        </div>
      )}

      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
        {/* Desktop Hairline Connecting Line */}
        <div className="hidden md:block absolute left-6 right-6 top-4 h-[1px] bg-[#E4DDCB] -z-0" />

        {steps.map((step, idx) => {
          const state = getStepState(step.id);
          const isComplete = state === "complete";
          const isCurrent = state === "current";
          const isDisputed = state === "disputed";

          return (
            <div key={step.id} className="relative z-10 flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center">
              {/* Numbered / Checked Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs transition-colors ${
                  isComplete || isCurrent
                    ? "bg-[#1C5A44] text-white"
                    : isDisputed
                    ? "bg-[#A33B2E] text-white"
                    : "bg-[#FFFFFF] text-[#8A8271] border border-[#C7BFAC]"
                }`}
              >
                {isComplete ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Label */}
              <div className="flex flex-col">
                <span
                  className={`text-xs font-semibold ${
                    isComplete || isCurrent
                      ? "text-[#1F1B14]"
                      : isDisputed
                      ? "text-[#A33B2E]"
                      : "text-[#8A8271]"
                  }`}
                >
                  {step.name}
                </span>
                <span className="text-[11px] text-[#8A8271] max-w-[130px] leading-tight mt-0.5 hidden sm:block">
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
