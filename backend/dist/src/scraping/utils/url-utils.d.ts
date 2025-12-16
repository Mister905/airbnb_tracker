export declare function extractRoomIdFromUrl(url: string | null | undefined): string | null;
export declare function extractRoomUrl(listing: {
    url?: string;
    listingUrl?: string;
    roomUrl?: string;
    roomId?: string;
    id?: string;
    listingId?: string;
}): string | null;
export declare function extractRoomUrls(listings: any[]): string[];
