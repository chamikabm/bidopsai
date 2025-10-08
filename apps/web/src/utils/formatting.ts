// Date formatting utilities
export function formatDate(date: string | Date | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return formatDate(d);
}

// Currency formatting
export function formatCurrency(
  amount: number | undefined,
  currency: string = "USD"
): string {
  if (amount === undefined) return "N/A";
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// File size formatting
export function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined || bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

// Percentage formatting
export function formatPercentage(value: number | undefined): string {
  if (value === undefined) return "0%";
  return `${Math.round(value)}%`;
}

// Number abbreviation (e.g., 1000 -> 1K)
export function abbreviateNumber(num: number | undefined): string {
  if (num === undefined) return "0";
  if (num < 1000) return num.toString();

  const units = ["K", "M", "B", "T"];
  const unitIndex = Math.floor((num.toString().length - 1) / 3) - 1;
  const unitValue = Math.pow(1000, unitIndex + 1);
  const abbreviated = (num / unitValue).toFixed(1);

  return `${abbreviated}${units[unitIndex]}`;
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

// Pluralize word based on count
export function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}

// Format duration in seconds to human readable
export function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined || seconds === 0) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}