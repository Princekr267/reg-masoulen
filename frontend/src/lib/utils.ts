/**
 * Utility functions for masoulen registration site
 */

export function classNames(...classes: Array<string | boolean | undefined | null>): string {
  return classes.filter(Boolean).join(' ');
}

export function collapseWhitespace(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

export function cleanPhone(raw: string): string {
  let cleaned = raw.replace(/\s+/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Normalizes email for duplicate comparison across members.
 * Gmail dot and plus variants count as the same email.
 */
export function canonicalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) return trimmed;

  let local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.replace(/\./g, '');
    const plusIndex = local.indexOf('+');
    if (plusIndex !== -1) {
      local = local.slice(0, plusIndex);
    }
  }

  return `${local}@${domain}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch {
    return false;
  }
}

export interface CountdownState {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isClosed: boolean;
}

export function calculateCountdown(regCloseAtIso: string, serverOffsetMs: number = 0): CountdownState {
  const closeTime = new Date(regCloseAtIso).getTime();
  const correctedNow = Date.now() + serverOffsetMs;
  const totalMs = closeTime - correctedNow;

  if (isNaN(closeTime) || totalMs <= 0) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isClosed: true,
    };
  }

  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  return {
    totalMs,
    days,
    hours,
    minutes,
    seconds,
    isClosed: false,
  };
}

/**
 * Sanitizes cell for CSV export to prevent formula injection.
 * Any cell starting with =, +, -, @ is prefixed with '
 */
export function sanitizeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value);
  let escaped = str.replace(/"/g, '""');
  if (/^[=+\-@]/.test(str)) {
    escaped = `'${escaped}`;
  }
  return `"${escaped}"`;
}

export function downloadCsvFile(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

