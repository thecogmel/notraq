import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number as BRL currency: 12.5 -> 'R$ 12,50' */
export function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

/** Generate a consistent color for a name (avatars, icons) */
export function getNameColor(name: string): string {
  const colors = ['#34d399', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#facc15'];
  const idx = (name.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
}

/** Convert string to Title Case: 'ARROZ TIPO 1' -> 'Arroz Tipo 1' */
export function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
