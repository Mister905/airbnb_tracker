/**
 * Utility functions for parsing and normalizing amenities data
 */

/**
 * Normalizes amenities data from various possible formats to a string array.
 * 
 * Handles:
 * - PostgreSQL arrays (already parsed by Prisma as JS arrays)
 * - JSONB arrays (already parsed by Prisma)
 * - JSON strings (needs parsing)
 * - Objects with title/values structure
 * - Missing/null/undefined (returns empty array)
 * - Invalid JSON (returns empty array with console warning)
 * 
 * @param amenities - Raw amenities data (can be string[], string, object[], null, undefined, or any)
 * @returns Normalized array of amenity strings
 */
export function normalizeAmenities(amenities: any): string[] {
  // Handle null/undefined
  if (amenities == null) {
    return [];
  }

  // Already an array - validate and return
  if (Array.isArray(amenities)) {
    return amenities
      .map((item) => {
        // Handle string items
        if (typeof item === 'string') {
          return item.trim();
        }
        // Handle object items with name/title
        if (typeof item === 'object' && item !== null) {
          return item.name || item.title || String(item);
        }
        // Convert other types to string
        return String(item);
      })
      .filter((item): item is string => item != null && item.length > 0);
  }

  // If it's a string, try to parse it as JSON
  if (typeof amenities === 'string') {
    // Empty string
    if (amenities.trim() === '') {
      return [];
    }

    try {
      const parsed = JSON.parse(amenities);
      // Recursively call if parsing succeeded (might be nested)
      if (Array.isArray(parsed)) {
        return normalizeAmenities(parsed);
      }
      // If parsed to a single value, wrap it
      if (typeof parsed === 'string') {
        return [parsed.trim()].filter((item) => item.length > 0);
      }
      // If parsed to something else, return empty
      console.warn('[Amenities] Parsed JSON is not an array or string:', parsed);
      return [];
    } catch (e) {
      // Not valid JSON - might be a comma-separated string
      // Try splitting by comma as fallback
      return amenities
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  }

  // Unknown type - return empty array
  console.warn('[Amenities] Unknown amenities type:', typeof amenities, amenities);
  return [];
}

