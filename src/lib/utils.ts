import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalizeText(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function capitalizeWords(text: string): string {
  if (!text) return text;
  return text.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function normalizeAccountNumber(account: string | null | undefined): string {
  if (!account) return '';
  return account.toString().replace(/^0+/, '') || '0';
}

export function accountNumbersMatch(input: string, storedAccount: string | null | undefined): boolean {
  if (!input || !storedAccount) return false;
  return normalizeAccountNumber(input) === normalizeAccountNumber(storedAccount);
}
