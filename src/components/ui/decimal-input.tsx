"use client";

import * as React from "react";
import { cn, formatNumber } from "@/lib/utils";

const MAX_CENTS = 99999999999999; // 12 dígitos antes da vírgula + 2 depois

function formatCentsToDisplay(cents: number): string {
  return formatNumber(cents / 100, 2);
}

export interface DecimalInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value: number | undefined | null;
  onChange: (value: number) => void;
  }

/**
 * Input numérico com autoformatação em 2 casas decimais e vírgula.
 * O usuário digita os dígitos e o valor é interpretado como centavos:
 * 1 → 0,01 | 15 → 0,15 | 123 → 1,23
 */
const DecimalInput = React.forwardRef<HTMLInputElement, DecimalInputProps>(
  ({ className, value, onChange, onFocus, onBlur, onKeyDown, ...props }, ref) => {
    const numValue = typeof value === "number" && !Number.isNaN(value) ? value : 0;
    const [editingCents, setEditingCents] = React.useState<number | null>(null);

    const isEditing = editingCents !== null;
    const cents = isEditing ? editingCents : Math.round(numValue * 100);
    const isEmpty = (value === undefined || value === null) && !isEditing;
    const display = isEmpty ? "" : formatCentsToDisplay(cents);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (value !== undefined && value !== null) {
        setEditingCents(Math.round(numValue * 100));
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setEditingCents(null);
      onBlur?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const key = e.key;
      if (key === "Backspace") {
        e.preventDefault();
        const current = editingCents ?? Math.round(numValue * 100);
        const next = Math.floor(current / 10);
        setEditingCents(next);
        onChange(next / 100);
        return;
      }
      if (key >= "0" && key <= "9") {
        e.preventDefault();
        const digit = parseInt(key, 10);
        const current = editingCents ?? Math.round(numValue * 100);
        let next = current * 10 + digit;
        if (next > MAX_CENTS) return;
        setEditingCents(next);
        onChange(next / 100);
        return;
      }
      // Bloquear outros caracteres que alterariam o texto (setas, etc. permitidos)
      if ([".", ",", "e", "E", "-", "+"].includes(key)) {
        e.preventDefault();
      }
      onKeyDown?.(e);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
      if (!pasted) return;
      const parsed = parseInt(pasted.slice(0, 14), 10); // limita tamanho
      if (Number.isNaN(parsed)) return;
      const next = Math.min(parsed, MAX_CENTS);
      setEditingCents(next);
      onChange(next / 100);
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className
        )}
        value={display}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder="0,00"
        {...props}
      />
    );
  }
);
DecimalInput.displayName = "DecimalInput";

export { DecimalInput };
