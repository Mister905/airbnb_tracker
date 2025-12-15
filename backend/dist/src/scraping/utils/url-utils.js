"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractRoomIdFromUrl = extractRoomIdFromUrl;
exports.extractRoomUrl = extractRoomUrl;
exports.extractRoomUrls = extractRoomUrls;
function extractRoomIdFromUrl(url) {
    if (!url) {
        return null;
    }
    const urlStr = String(url).trim();
    const roomsMatch = urlStr.match(/\/rooms\/(\d+)/i);
    if (roomsMatch) {
        return roomsMatch[1];
    }
    if (/^\d+$/.test(urlStr)) {
        return urlStr;
    }
    const numberMatch = urlStr.match(/(\d+)(?:[/?#]|$)/);
    if (numberMatch) {
        return numberMatch[1];
    }
    return null;
}
function extractRoomUrl(listing) {
    let roomUrl = listing.url || listing.listingUrl || listing.roomUrl;
    if (roomUrl) {
        if (!roomUrl.startsWith('http')) {
            const roomId = extractRoomIdFromUrl(roomUrl) ||
                listing.roomId ||
                listing.id ||
                listing.listingId;
            if (roomId) {
                return `https://www.airbnb.com/rooms/${roomId}`;
            }
        }
        else {
            return roomUrl;
        }
    }
    const roomId = listing.roomId || listing.id || listing.listingId;
    if (roomId) {
        return `https://www.airbnb.com/rooms/${roomId}`;
    }
    return null;
}
function extractRoomUrls(listings) {
    const roomUrls = [];
    for (const listing of listings) {
        const roomUrl = extractRoomUrl(listing);
        if (roomUrl && !roomUrls.includes(roomUrl)) {
            roomUrls.push(roomUrl);
        }
    }
    return roomUrls;
}
//# sourceMappingURL=url-utils.js.map