import { CheckCircle2, Clock, AlertTriangle, Lock } from "lucide-react";

export type TransactionStatus =
  | "created"
  | "locked"
  | "dispatched"
  | "delivered"
  | "settled"
  | "disputed";

export type FulfillmentType =
  | "shipped"
  | "delivered"
  | "service_completed"
  | "digital_sent"
  | null
  | undefined;

interface TransactionProgressProps {
  status: TransactionStatus;
  fulfillmentType?: FulfillmentType;
  sellerConfirmedAt?: string | null;
  buyerConfirmedAt?: string | null;
  createdAt?: string;
}

const FULFILLMENT_LABELS: Record<string, string> = {
  shipped: "Item Shipped",
  delivered: "Item Delivered",
  service_completed: "Service Completed",
  digital_sent: "Digital Product Sent",
};

function formatTime(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TransactionProgress({
  status,
  fulfillmentType,
  sellerConfirmedAt,
  buyerConfirmedAt,
  createdAt,
}: TransactionProgressProps) {
  const isDisputed = status === "disputed";
  const paymentReceived = status !== "created";
  const sellerFulfilled = !!sellerConfirmedAt || ["dispatched", "delivered", "settled"].includes(status);
  const buyerConfirmed = !!buyerConfirmedAt || status === "settled";
  const escrowReleased = status === "settled";

  const steps = [
    {
      id: "payment",
      label: "Payment Received",
      sublabel: paymentReceived ? "Funds locked in escrow" : "Waiting for buyer payment",
      timestamp: paymentReceived ? formatTime(createdAt) : null,
      complete: paymentReceived,
      active: !paymentReceived,
      disputed: false,
    },
    {
      id: "seller",
      label: "Seller Fulfilled",
      sublabel: sellerFulfilled
        ? (fulfillmentType ? FULFILLMENT_LABELS[fulfillmentType] : "Order fulfilled")
        : "Awaiting seller confirmation",
      timestamp: formatTime(sellerConfirmedAt),
      complete: sellerFulfilled && !isDisputed,
      active: paymentReceived && !sellerFulfilled,
      disputed: isDisputed && sellerFulfilled,
    },
    {
      id: "buyer",
      label: "Buyer Confirmed",
      sublabel: buyerConfirmed
        ? "Receipt confirmed"
        : isDisputed
        ? "Dispute raised — under review"
        : "Awaiting buyer confirmation",
      timestamp: formatTime(buyerConfirmedAt),
      complete: buyerConfirmed,
      active: sellerFulfilled && !buyerConfirmed && !isDisputed,
      disputed: isDisputed,
    },
    {
      id: "escrow",
      label: "Escrow Release",
      sublabel: escrowReleased
        ? "Funds released to seller"
        : "Pending completion",
      timestamp: formatTime(buyerConfirmedAt),
      complete: escrowReleased,
      active: false,
      disputed: false,
    },
  ];

  return (
    <div className="space-y-0">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const icon = step.disputed ? (
          <AlertTriangle className="w-4 h-4" />
        ) : step.complete ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : step.id === "escrow" ? (
          <Lock className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        );

        const circleClass = step.disputed
          ? "bg-red-500 border-red-500 text-white"
          : step.complete
          ? "bg-emerald-500 border-emerald-500 text-white"
          : step.active
          ? "bg-amber-400 border-amber-400 text-white"
          : "bg-background border-muted text-muted-foreground";

        const lineClass = step.complete
          ? "bg-emerald-500"
          : "bg-muted";

        return (
          <div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${circleClass}`}>
                {icon}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-6 my-1 ${lineClass}`} />
              )}
            </div>
            <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
              <p className={`font-semibold text-sm leading-tight ${step.disputed ? "text-red-600" : step.complete ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </p>
              <p className={`text-xs mt-0.5 ${step.disputed ? "text-red-500" : "text-muted-foreground"}`}>
                {step.sublabel}
              </p>
              {step.timestamp && (
                <p className="text-xs text-muted-foreground/60 mt-0.5">{step.timestamp}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
