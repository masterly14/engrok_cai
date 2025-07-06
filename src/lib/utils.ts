import { type ClassValue, clsx } from "clsx"
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

export function findBestMatchingToken(credentials: any): string | null {
  if (!credentials || !Array.isArray(credentials)) {
    return null
  }

  const now = Date.now()

  // Find a non-expired token first
  const nonExpired = credentials.find(
    (cred) => cred.expires_at && new Date(cred.expires_at).getTime() > now
  )

  if (nonExpired) {
    return nonExpired.access_token
  }

  // If all are expired, return the most recently expired one, if available
  const sortedByExpiry = credentials
    .filter((cred) => cred.expires_at)
    .sort((a, b) => new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime())

  if (sortedByExpiry.length > 0) {
    return sortedByExpiry[0].access_token
  }

  // Fallback to the first token found if no expiry info is available
  if (credentials.length > 0 && credentials[0].access_token) {
    return credentials[0].access_token
  }

  return null
}