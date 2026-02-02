import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formata número com 2 casas decimais, vírgula decimal e ponto como separador de milhar (PT-BR). */
export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "0,00"
  const [intPart, decPart] = value.toFixed(decimals).split(".")
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return decPart != null ? `${withThousands},${decPart}` : withThousands
}

/** Formata valor monetário: "R$ 1.234,56". */
export function formatCurrency(value: number, decimals = 2): string {
  return `R$ ${formatNumber(value, decimals)}`
}
