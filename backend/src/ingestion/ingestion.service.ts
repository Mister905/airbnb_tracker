import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ApifyListingData {
  id?: string;
  title?: string;
  description?: string;
  location?: string;
  price?: number | { amount?: number; value?: number; price?: number; total?: number; currency?: string; currencyCode?: string } | string;
  currency?: string;
  rating?: number | { value?: number; rating?: number; score?: number; average?: number } | string;
  reviewCount?: number | { value?: number; count?: number; total?: number } | string;
  amenities?: any[];
  photos?: Array<{ url: string; caption?: string }>;
  images?: Array<{ url: string; caption?: string } | string>;
  photoUrls?: string[];
  reviews?: Array<{
    id: string;
    reviewerName?: string;
    reviewerAvatar?: string;
    rating?: number;
    comment?: string;
    date?: string;
  }>;
  reviewsList?: Array<any>;
  reviewList?: Array<any>;
  [key: string]: any; // Allow additional properties for flexibility
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(private prisma: PrismaService) {}

  async ingestData(
    trackedUrlId: string,
    userId: string,
    data: ApifyListingData[],
    scrapeRunId: string,
  ) {
    if (!data || data.length === 0) {
      this.logger.warn('No data provided to ingest');
      return;
    }

    this.logger.log(`Processing ${data.length} item(s) from Apify`);
    const listingData = data[0]; // Assuming single listing per URL

    // Find or create listing
    let listing = await this.prisma.listing.findUnique({
      where: { trackedUrlId },
    });

    if (!listing) {
      listing = await this.prisma.listing.create({
        data: {
          trackedUrlId,
          airbnbId: listingData.id,
          title: listingData.title,
          description: listingData.description,
          location: listingData.location,
        },
      });
    } else {
      // Update listing if needed
      listing = await this.prisma.listing.update({
        where: { id: listing.id },
        data: {
          title: listingData.title,
          description: listingData.description,
          location: listingData.location,
        },
      });
    }

    // Get latest snapshot version
    const latestSnapshot = await this.prisma.listingSnapshot.findFirst({
      where: { listingId: listing.id },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestSnapshot?.version || 0) + 1;

    // Extract price value - handle both number and object formats
    let priceValue: number | null = null;
    if (listingData.price !== undefined && listingData.price !== null) {
      if (typeof listingData.price === 'number') {
        priceValue = listingData.price;
      } else if (typeof listingData.price === 'object') {
        // Handle object format like { amount: 100, value: 100, price: 100, etc. }
        const priceObj = listingData.price as any;
        priceValue = priceObj.amount || priceObj.value || priceObj.price || priceObj.total || null;
        if (priceValue !== null && typeof priceValue !== 'number') {
          priceValue = parseFloat(String(priceValue)) || null;
        }
      } else if (typeof listingData.price === 'string') {
        priceValue = parseFloat(listingData.price) || null;
      }
    }

    // Extract currency if price is an object
    let currencyValue = listingData.currency;
    if (!currencyValue && typeof listingData.price === 'object' && listingData.price !== null) {
      const priceObj = listingData.price as any;
      currencyValue = priceObj.currency || priceObj.currencyCode || null;
    }

    // Extract rating value - handle both number and object formats
    let ratingValue: number | null = null;
    if (listingData.rating !== undefined && listingData.rating !== null) {
      if (typeof listingData.rating === 'number') {
        ratingValue = listingData.rating;
      } else if (typeof listingData.rating === 'object') {
        const ratingObj = listingData.rating as any;
        ratingValue = ratingObj.value || ratingObj.rating || ratingObj.score || ratingObj.average || null;
        if (ratingValue !== null && typeof ratingValue !== 'number') {
          ratingValue = parseFloat(String(ratingValue)) || null;
        }
      } else if (typeof listingData.rating === 'string') {
        ratingValue = parseFloat(listingData.rating) || null;
      }
    }

    // Extract reviewCount value - handle both number and object formats
    // Python script: item["rating"].get("reviewsCount", 0) - rating is an object
    let reviewCountValue: number | null = null;
    if (listingData.reviewCount !== undefined && listingData.reviewCount !== null) {
      if (typeof listingData.reviewCount === 'number') {
        reviewCountValue = listingData.reviewCount;
      } else if (typeof listingData.reviewCount === 'object') {
        const reviewCountObj = listingData.reviewCount as any;
        reviewCountValue = reviewCountObj.value || reviewCountObj.count || reviewCountObj.total || null;
        if (reviewCountValue !== null && typeof reviewCountValue !== 'number') {
          reviewCountValue = parseInt(String(reviewCountValue), 10) || null;
        }
      } else if (typeof listingData.reviewCount === 'string') {
        reviewCountValue = parseInt(listingData.reviewCount, 10) || null;
      }
    }
    
    // Also check rating object for reviewsCount (Python script pattern)
    if (!reviewCountValue && listingData.rating && typeof listingData.rating === 'object' && listingData.rating !== null) {
      const ratingObj = listingData.rating as any;
      const reviewsCount = ratingObj.reviewsCount || ratingObj.reviewCount || ratingObj.count;
      if (reviewsCount !== undefined && reviewsCount !== null) {
        reviewCountValue = typeof reviewsCount === 'number' ? reviewsCount : parseInt(String(reviewsCount), 10) || null;
      }
    }

    // Extract amenities - handle nested structure from Python script
    // Structure: amenities is array of categories, each category has values array
    // Each value has available boolean and title string
    let normalizedAmenities: any[] = [];
    
    if (listingData.amenities && Array.isArray(listingData.amenities)) {
      for (const category of listingData.amenities) {
        if (category && typeof category === 'object' && category.values && Array.isArray(category.values)) {
          for (const amenity of category.values) {
            if (amenity && typeof amenity === 'object') {
              // Only include available amenities (matching Python script logic)
              if (amenity.available === true || amenity.available === 'true') {
                const amenityTitle = amenity.title || amenity.name || amenity.label || String(amenity);
                if (amenityTitle) {
                  normalizedAmenities.push(amenityTitle);
                }
              }
            } else if (typeof amenity === 'string') {
              // Direct string amenity
              normalizedAmenities.push(amenity);
            }
          }
        } else if (typeof category === 'string') {
          // Direct string category
          normalizedAmenities.push(category);
        } else if (category && typeof category === 'object') {
          // Try to extract name/title from category object
          const categoryName = category.title || category.name || category.label;
          if (categoryName) {
            normalizedAmenities.push(categoryName);
          }
        }
      }
    } else if (Array.isArray(listingData.amenities)) {
      // Fallback: if amenities is already a flat array
      normalizedAmenities = listingData.amenities;
        }

    // Create new snapshot
    const snapshot = await this.prisma.listingSnapshot.create({
      data: {
        listingId: listing.id,
        version: nextVersion,
        description: listingData.description,
        amenities: normalizedAmenities.length > 0 ? normalizedAmenities : (listingData.amenities || []),
        price: priceValue,
        currency: currencyValue,
        rating: ratingValue,
        reviewCount: reviewCountValue,
      },
    });

    // Link the scrape run to the snapshot
    if (scrapeRunId) {
      await this.prisma.scrapeRun.update({
        where: { id: scrapeRunId },
        data: { snapshotId: snapshot.id },
      });
    }

    // Ingest photos - handle multiple possible field names and structures
    let photos: any[] = [];
    
    if (listingData.images && Array.isArray(listingData.images)) {
      photos = listingData.images;
    } else if (listingData.image_urls && Array.isArray(listingData.image_urls)) {
      photos = listingData.image_urls;
    } else if (listingData.photos && Array.isArray(listingData.photos)) {
      photos = listingData.photos;
    } else if (listingData.photoUrls && Array.isArray(listingData.photoUrls)) {
      photos = listingData.photoUrls;
    }
    
        if (photos.length > 0) {
          this.logger.debug(`Processing ${photos.length} photos for listing ${listing.id}`);
          await Promise.all(
        photos.map((photo, index) => {
          // Handle different photo structures
          let photoUrl: string | null = null;
          let photoCaption: string | null = null;
          
          if (typeof photo === 'string') {
            photoUrl = photo;
          } else if (typeof photo === 'object' && photo !== null) {
            const photoObj = photo as any;
            // Python script uses imageUrl, but also check other common names
            photoUrl = photoObj.imageUrl || photoObj.url || photoObj.src || photoObj.href || null;
            photoCaption = photoObj.caption || photoObj.alt || photoObj.title || photoObj.description || null;
          }
          
              if (!photoUrl) {
                this.logger.warn(`Skipping photo at index ${index} - no URL found`);
                return Promise.resolve(null);
              }
          
          return this.prisma.photo.create({
            data: {
              listingId: listing.id,
              snapshotId: snapshot.id,
              url: photoUrl,
              caption: photoCaption,
              order: index,
            },
          });
            }),
          );
        }

    // Ingest reviews - handle multiple possible field names and structures
    // Based on Python implementation: Apify reviews scraper uses reviewer object, text/localizedText, createdAt/localizedDate
    const reviews = listingData.reviews || listingData.reviewsList || listingData.reviewList || [];
    if (Array.isArray(reviews) && reviews.length > 0) {
      this.logger.debug(`Processing ${reviews.length} reviews for listing ${listing.id}`);
      await Promise.all(
        reviews.map((review) => {
          // Map author field - Apify reviews scraper uses "reviewer" object (Python lines 1034-1053)
          let reviewerName: string | null = null;
          const reviewerObj = review.reviewer;
          if (reviewerObj && typeof reviewerObj === 'object') {
            // Extract name from reviewer object
            reviewerName = reviewerObj.name || 
                          reviewerObj.fullName || 
                          reviewerObj.firstName || 
                          reviewerObj.displayName || 
                          null;
          } else {
            // Fallback to direct fields
            reviewerName = review.reviewerName || 
                          review.author || 
                          review.name || 
                          (typeof review.reviewer === 'string' ? review.reviewer : null) || 
                          null;
          }
          
          // Map rating field (Apify reviews scraper uses "rating" directly) (Python line 1056)
          let rating: number | null = null;
          const ratingValue = review.rating || review.stars || review.score || null;
          if (ratingValue !== null && ratingValue !== undefined) {
            if (typeof ratingValue === 'string') {
              rating = parseFloat(ratingValue) || null;
            } else {
              rating = Number(ratingValue);
            }
            // Convert to integer if it's a whole number (Python line 1062)
            rating = rating !== null && Number.isInteger(rating) ? Math.floor(rating) : rating;
          }
          
          // Map comment/text field - Apify uses "text" or "localizedText" (Python lines 1064-1073)
          const comment = review.text || 
                         review.localizedText || 
                         review.localizedReview || 
                         review.comment || 
                         review.review_text || 
                         review.reviewText || 
                         review.content || 
                         null;
          
          // Map date field - Apify reviews scraper uses "createdAt" or "localizedDate" (Python lines 1075-1084)
          let date: Date | null = null;
          const dateValue = review.createdAt || 
                           review.localizedDate || 
                           review.publishedAt || 
                           review.reviewDate || 
                           review.date || 
                           review.published_at || 
                           null;
          
          if (dateValue) {
            try {
              date = new Date(dateValue);
              // Validate date
              if (isNaN(date.getTime())) {
                date = null;
              }
            } catch (e) {
              date = null;
            }
          }
          
          // Map external review ID (Python lines 1086-1092)
          const reviewId = review.review_id || 
                          review.id || 
                          review.reviewId || 
                          `${reviewerName || 'unknown'}_${date ? date.toISOString().split('T')[0] : Date.now()}`;
          
          // Map reviewer avatar
          const reviewerAvatar = review.reviewerAvatar || 
                                review.avatar || 
                                review.reviewer_avatar || 
                                (reviewerObj && typeof reviewerObj === 'object' ? reviewerObj.avatar || reviewerObj.avatarUrl : null) || 
                                null;
          
          if (!reviewId) {
            this.logger.warn(`Skipping review - no ID found`);
            return Promise.resolve(null);
          }
          
          return this.prisma.review.upsert({
            where: { reviewId },
            create: {
              listingId: listing.id,
              snapshotId: snapshot.id,
              reviewId,
              reviewerName,
              reviewerAvatar,
              rating,
              comment,
              date,
            },
            update: {
              snapshotId: snapshot.id,
              rating,
              comment,
            },
          });
            }),
          );
        }

    return snapshot;
  }
}
