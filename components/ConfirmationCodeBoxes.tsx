"use client";

import { useRef } from "react";

interface ConfirmationCodeBoxesProps {
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
}

export function ConfirmationCodeBoxes({ value, onChange, readOnly = false }: ConfirmationCodeBoxesProps) {
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const digits = (value || "").slice(0, 4).padEnd(readOnly ? 4 : 0, "").split("");

  const handleChange = (index: number, char: string) => {
    if (readOnly || !onChange) return;
    const clean = char.replace(/[^0-9]/g, "");
    if (!clean && char !== "") return;

    const newDigits = [...digits];
    newDigits[index] = clean;
    const combined = newDigits.join("").slice(0, 4);
    onChange(combined);

    if (clean && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (readOnly || !onChange) return;
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (readOnly || !onChange) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 4);
    if (pasted) {
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, 3);
      inputRefs[focusIndex].current?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2 sm:space-x-3 my-2" onPaste={handlePaste}>
      {[0, 1, 2, 3].map((idx) => (
        <div
          key={idx}
          className="w-[44px] sm:w-[48px] h-[52px] sm:h-[56px] bg-white border border-[#E4DDCB] rounded-lg flex items-center justify-center shadow-xs shrink-0"
        >
          {readOnly ? (
            <span className="font-mono text-xl sm:text-2xl font-semibold text-[#1F1B14] tracking-tight">
              {digits[idx] || "•"}
            </span>
          ) : (
            <input
              ref={inputRefs[idx]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digits[idx] || ""}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-full h-full text-center font-mono text-xl sm:text-2xl font-semibold text-[#1F1B14] bg-transparent outline-none focus:border-[#1C5A44] border-0 p-0"
            />
          )}
        </div>
      ))}
    </div>
  );
}
