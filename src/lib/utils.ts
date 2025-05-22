import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function sanitizeData(data: any): any {
  if (!data) return data;
  
  // For debugging
  console.log("Sanitizing data type:", typeof data);
  
  // If it's an object, recursively sanitize all properties
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      // For arrays, sanitize each element
      return data.map(item => sanitizeData(item));
    } else {
      // For objects, sanitize each property
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        console.log(`Sanitizing key: ${key}, type: ${typeof value}`);
        sanitized[key] = sanitizeData(value);
      }
      return sanitized;
    }
  }
  
  // For strings, remove null bytes
  if (typeof data === 'string') {
    // Check if string contains null bytes and log for debugging
    const containsNullBytes = data.includes('\0');
    if (containsNullBytes) {
      console.log("Found null bytes in string:", data);
    }
    return data.replace(/\0/g, '');
  }
  
  // Return other types as is
  return data;
}