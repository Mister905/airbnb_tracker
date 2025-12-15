/**
 * Utility functions for extracting room IDs from Airbnb URLs
 * Based on legacy Python implementation
 */

/**
 * Extract room ID from an Airbnb URL
 * Handles formats like:
 * - https://www.airbnb.com/rooms/123456
 * - https://www.airbnb.com/rooms/123456?...
 * - /rooms/123456
 * - Just the number: 123456
 */
export function extractRoomIdFromUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  const urlStr = String(url).trim();

  // Try to match /rooms/123456 pattern
  const roomsMatch = urlStr.match(/\/rooms\/(\d+)/i);
  if (roomsMatch) {
    return roomsMatch[1];
  }

  // Try to match just a number (if URL is just the ID)
  if (/^\d+$/.test(urlStr)) {
    return urlStr;
  }

  // Try to extract any number from the URL as fallback
  const numberMatch = urlStr.match(/(\d+)(?:[/?#]|$)/);
  if (numberMatch) {
    return numberMatch[1];
  }

  return null;
}

/**
 * Extract room URL from listing data
 * Returns full Airbnb URL (e.g., "https://www.airbnb.com/rooms/123456")
 */
export function extractRoomUrl(listing: {
  url?: string;
  listingUrl?: string;
  roomUrl?: string;
  roomId?: string;
  id?: string;
  listingId?: string;
}): string | null {
  // Try different possible URL fields
  let roomUrl = listing.url || listing.listingUrl || listing.roomUrl;

  // If we have a URL, ensure it's a full URL
  if (roomUrl) {
    if (!roomUrl.startsWith('http')) {
      // Construct full URL from room ID
      const roomId = extractRoomIdFromUrl(roomUrl) || 
                     listing.roomId || 
                     listing.id || 
                     listing.listingId;
      if (roomId) {
        return `https://www.airbnb.com/rooms/${roomId}`;
      }
    } else {
      return roomUrl;
    }
  }

  // Try to extract room ID and construct URL
  const roomId = listing.roomId || listing.id || listing.listingId;
  if (roomId) {
    return `https://www.airbnb.com/rooms/${roomId}`;
  }

  return null;
}

/**
 * Extract room URLs from a list of listings
 * Returns array of full Airbnb URLs
 */
export function extractRoomUrls(listings: any[]): string[] {
  const roomUrls: string[] = [];

  for (const listing of listings) {
    const roomUrl = extractRoomUrl(listing);
    if (roomUrl && !roomUrls.includes(roomUrl)) {
      roomUrls.push(roomUrl);
    }
  }

  return roomUrls;
}

