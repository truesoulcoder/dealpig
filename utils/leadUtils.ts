// utils/leadUtils.ts

export interface ProcessingStatus {
  id: number;
  file: string;
  status: string;
  completed_at: string | null;
  normalized_at: string | null;
  // Add other properties that might be in your ProcessingStatus
  contact_name?: string;
  contact_email?: string;
  property_address?: string;
}

/**
 * Removes duplicate processing statuses based on contact_name, contact_email, and property_address.
 * Keeps the first occurrence of each duplicate set.
 */
export function removeDuplicateStatuses(statuses: ProcessingStatus[]): ProcessingStatus[] {
  const seen = new Map<string, ProcessingStatus>();
  const result: ProcessingStatus[] = [];

  for (const status of statuses) {
    // Create a unique key from the three fields
    const key = [
      (status.contact_name || '').toLowerCase().trim(),
      (status.contact_email || '').toLowerCase().trim(),
      (status.property_address || '').toLowerCase().trim()
    ].join('|');

    if (!seen.has(key) || key === '||') {  // Skip empty keys (if all fields are empty)
      seen.set(key, status);
      result.push(status);
    }
  }

  return result;
}

/**
 * Counts the number of duplicate statuses in the array
 */
export function countDuplicateStatuses(statuses: ProcessingStatus[]): number {
  const seen = new Set<string>();
  let duplicateCount = 0;

  for (const status of statuses) {
    const key = [
      (status.contact_name || '').toLowerCase().trim(),
      (status.contact_email || '').toLowerCase().trim(),
      (status.property_address || '').toLowerCase().trim()
    ].join('|');

    if (key === '||') continue;  // Skip empty keys

    if (seen.has(key)) {
      duplicateCount++;
    } else {
      seen.add(key);
    }
  }

  return duplicateCount;
}