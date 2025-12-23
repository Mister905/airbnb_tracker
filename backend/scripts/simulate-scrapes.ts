import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env file
config({ path: path.join(__dirname, '..', '..', '.env') });

// Allow DATABASE_URL override via environment variable or command line argument
// Usage: DATABASE_URL=postgresql://... npm run simulate:scrapes
// Or: npm run simulate:scrapes -- --database-url=postgresql://...
const databaseUrl = process.env.DATABASE_URL || 
  process.argv.find(arg => arg.startsWith('--database-url='))?.split('=')[1];

const prisma = new PrismaClient(
  databaseUrl ? {
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  } : undefined
);

interface Photo {
  url: string;
  caption?: string | null;
}

interface Review {
  reviewId: string;
  reviewerName?: string | null;
  reviewerAvatar?: string | null;
  rating?: number | null;
  comment?: string | null;
  date?: Date | null;
}

async function simulateScrapes() {
  try {
    console.log('🔍 Finding all listings with existing snapshots...\n');

    // Get all listings that have snapshots
    const listings = await prisma.listing.findMany({
      where: {
        snapshots: {
          some: {},
        },
      },
      include: {
        snapshots: {
          orderBy: { version: 'desc' },
          take: 1, // Get latest snapshot
          include: {
            photos: {
              orderBy: { order: 'asc' },
            },
            reviews: {
              orderBy: { date: 'desc' },
            },
          },
        },
      },
    });

    if (listings.length === 0) {
      console.log('❌ No listings with snapshots found. Please create some listings and snapshots first.');
      process.exit(1);
    }

    console.log(`📋 Found ${listings.length} listing(s) to simulate scrapes for.\n`);

    for (const listing of listings) {
      const latestSnapshot = listing.snapshots[0];
      if (!latestSnapshot) {
        console.log(`⚠️  Skipping listing ${listing.id} - no snapshots found`);
        continue;
      }

      console.log(`\n📸 Processing listing: ${listing.title || listing.id}`);
      console.log(`   Current snapshot version: ${latestSnapshot.version}`);

      // Get current data
      const currentDescription = latestSnapshot.description || '';
      const currentAmenities = (latestSnapshot.amenities as string[]) || [];
      const currentPhotos = latestSnapshot.photos || [];
      const currentReviews = latestSnapshot.reviews || [];
      const currentPrice = latestSnapshot.price;
      const currentRating = latestSnapshot.rating;
      const currentReviewCount = latestSnapshot.reviewCount;

      // Simulate realistic changes
      const nextVersion = latestSnapshot.version + 1;

      // 1. Description changes - subtle updates
      let newDescription = currentDescription;
      if (currentDescription) {
        // Add a sentence or modify existing text
        if (currentDescription.includes('cozy') && !currentDescription.includes('comfortable and cozy')) {
          // Only replace if "comfortable and cozy" doesn't already exist
          newDescription = currentDescription.replace(/cozy/gi, 'comfortable and cozy');
        } else if (currentDescription.includes('modern') && !currentDescription.includes('contemporary and modern')) {
          // Only replace if "contemporary and modern" doesn't already exist
          newDescription = currentDescription.replace(/modern/gi, 'contemporary and modern');
        } else if (!currentDescription.includes('recently updated')) {
          // Add a new sentence at the end if it doesn't already exist
          newDescription = currentDescription + ' This space has been recently updated with fresh amenities and thoughtful touches for your comfort.';
        }
      } else {
        newDescription = 'A beautiful and well-appointed space perfect for your stay.';
      }

      // 2. Amenities - add/remove some
      const newAmenities = [...currentAmenities];
      
      // Remove 1-2 amenities (if there are enough)
      if (newAmenities.length > 3) {
        const toRemove = Math.min(2, Math.floor(newAmenities.length / 3));
        for (let i = 0; i < toRemove; i++) {
          const randomIndex = Math.floor(Math.random() * newAmenities.length);
          newAmenities.splice(randomIndex, 1);
        }
      }
      
      // Add 1-3 new amenities
      const possibleAmenities = [
        'High-speed WiFi',
        'Smart TV',
        'Air conditioning',
        'Heating',
        'Washer',
        'Dryer',
        'Kitchen',
        'Free parking',
        'Gym access',
        'Pool access',
        'Hot tub',
        'Fireplace',
        'Balcony',
        'Garden',
        'Pet-friendly',
      ];
      
      const availableToAdd = possibleAmenities.filter(a => !newAmenities.includes(a));
      const toAdd = Math.min(3, availableToAdd.length);
      for (let i = 0; i < toAdd; i++) {
        const randomIndex = Math.floor(Math.random() * availableToAdd.length);
        newAmenities.push(availableToAdd[randomIndex]);
        availableToAdd.splice(randomIndex, 1);
      }

      // 3. Photos - subtle changes with realistic reordering of top photos
      // Start with all existing photos to preserve them
      const newPhotos: Photo[] = currentPhotos.map(p => ({
        url: p.url,
        caption: p.caption,
      }));
      
      // Reorder top 5-10 photos (realistic: owners reorder featured photos)
      if (newPhotos.length >= 5) {
        const topPhotoCount = Math.min(10, Math.floor(newPhotos.length / 2));
        const topPhotos = newPhotos.slice(0, topPhotoCount);
        
        // Shuffle the top photos to simulate reordering
        // Use Fisher-Yates shuffle for a few swaps (2-4 swaps)
        const swapCount = Math.min(4, Math.floor(topPhotoCount / 2));
        for (let i = 0; i < swapCount; i++) {
          const index1 = Math.floor(Math.random() * topPhotoCount);
          const index2 = Math.floor(Math.random() * topPhotoCount);
          if (index1 !== index2) {
            // Swap photos
            [newPhotos[index1], newPhotos[index2]] = [newPhotos[index2], newPhotos[index1]];
          }
        }
      }
      
      // Only remove 1 photo if there are enough (subtle change)
      // Remove from middle/end, not from top featured photos
      if (newPhotos.length > 10) {
        const removeIndex = 10 + Math.floor(Math.random() * (newPhotos.length - 10));
        newPhotos.splice(removeIndex, 1);
      }
      
      // Only add 1 new photo (subtle change)
      // Add to the end, not to top positions
      const photoUrls = [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe35?w=800',
      ];
      
      // Only add 1 new photo, and only if we have room
      const existingUrls = new Set(newPhotos.map(p => p.url));
      const availableUrls = photoUrls.filter(url => !existingUrls.has(url));
      if (availableUrls.length > 0 && newPhotos.length < 80) {
        const randomUrl = availableUrls[Math.floor(Math.random() * availableUrls.length)];
        newPhotos.push({
          url: randomUrl,
          caption: `Room view ${newPhotos.length + 1}`,
        });
      }

      // 4. Reviews - add new reviews
      const newReviews: Review[] = [...currentReviews];
      
      // Add 2-3 new reviews
      const reviewerNames = ['Sarah M.', 'Michael T.', 'Emily R.', 'David L.', 'Jessica K.'];
      const reviewComments = [
        'Great stay! Everything was perfect.',
        'Loved the location and the space was very clean.',
        'Would definitely stay here again. Highly recommend!',
        'Beautiful place with all the amenities we needed.',
        'The host was very responsive and helpful.',
        'Perfect for our weekend getaway.',
        'Clean, comfortable, and well-equipped.',
      ];
      
      const toAddReviews = Math.min(3, 5);
      for (let i = 0; i < toAddReviews; i++) {
        const reviewerName = reviewerNames[Math.floor(Math.random() * reviewerNames.length)];
        const comment = reviewComments[Math.floor(Math.random() * reviewComments.length)];
        const rating = 4 + Math.floor(Math.random() * 2); // 4 or 5
        const daysAgo = Math.floor(Math.random() * 30); // Within last 30 days
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        newReviews.push({
          reviewId: `review_${Date.now()}_${i}`,
          reviewerName,
          reviewerAvatar: `https://i.pravatar.cc/150?u=${reviewerName}`,
          rating,
          comment,
          date,
        });
      }

      // 5. Price - subtle change (±5%)
      let newPrice = currentPrice;
      if (currentPrice) {
        const changePercent = (Math.random() * 0.1) - 0.05; // -5% to +5%
        newPrice = Math.round(currentPrice * (1 + changePercent));
      }

      // 6. Rating - slight change (±0.1)
      let newRating = currentRating;
      if (currentRating) {
        const change = (Math.random() * 0.2) - 0.1; // -0.1 to +0.1
        newRating = Math.round((currentRating + change) * 10) / 10;
        newRating = Math.max(1, Math.min(5, newRating)); // Clamp between 1 and 5
      }

      // 7. Review count - increase by number of new reviews
      const newReviewCount = (currentReviewCount || 0) + toAddReviews;

      // Create new snapshot
      console.log(`   Creating snapshot version ${nextVersion}...`);
      
      const snapshot = await prisma.listingSnapshot.create({
        data: {
          listingId: listing.id,
          version: nextVersion,
          description: newDescription,
          amenities: newAmenities,
          price: newPrice,
          currency: latestSnapshot.currency,
          rating: newRating,
          reviewCount: newReviewCount,
        },
      });

      // Create photos (photos will get new IDs, but comparison uses URL as identifier)
      console.log(`   Adding ${newPhotos.length} photos...`);
      await Promise.all(
        newPhotos.map((photo, index) =>
          prisma.photo.create({
            data: {
              listingId: listing.id,
              snapshotId: snapshot.id,
              url: photo.url,
              caption: photo.caption,
              order: index,
            },
          })
        )
      );

      // Create reviews - preserve existing reviews and add new ones
      console.log(`   Processing ${newReviews.length} reviews...`);
      const existingReviewIds = new Set(currentReviews.map(r => r.reviewId));
      const reviewsToCreate = newReviews.filter(r => !existingReviewIds.has(r.reviewId));
      const reviewsToUpdate = newReviews.filter(r => existingReviewIds.has(r.reviewId));
      
      console.log(`      - ${reviewsToUpdate.length} existing reviews`);
      console.log(`      - ${reviewsToCreate.length} new reviews`);
      
      await Promise.all([
        // Update existing reviews to link to new snapshot
        ...reviewsToUpdate.map((review) =>
          prisma.review.updateMany({
            where: { reviewId: review.reviewId },
            data: {
              snapshotId: snapshot.id,
              rating: review.rating,
              comment: review.comment,
            },
          })
        ),
        // Create new reviews
        ...reviewsToCreate.map((review) =>
          prisma.review.create({
            data: {
              listingId: listing.id,
              snapshotId: snapshot.id,
              reviewId: review.reviewId,
              reviewerName: review.reviewerName,
              reviewerAvatar: review.reviewerAvatar,
              rating: review.rating,
              comment: review.comment,
              date: review.date,
            },
          })
        ),
      ]);

      // Create a scrape run
      await prisma.scrapeRun.create({
        data: {
          trackedUrlId: listing.trackedUrlId,
          status: 'completed',
          startedAt: new Date(Date.now() - 60000), // 1 minute ago
          completedAt: new Date(),
          snapshotId: snapshot.id,
        },
      });

      console.log(`   ✅ Snapshot ${nextVersion} created successfully!`);
      console.log(`   Changes:`);
      console.log(`     - Description: ${currentDescription !== newDescription ? 'Updated' : 'Unchanged'}`);
      console.log(`     - Amenities: ${currentAmenities.length} → ${newAmenities.length} (${newAmenities.length - currentAmenities.length > 0 ? '+' : ''}${newAmenities.length - currentAmenities.length})`);
      console.log(`     - Photos: ${currentPhotos.length} → ${newPhotos.length} (${newPhotos.length - currentPhotos.length > 0 ? '+' : ''}${newPhotos.length - currentPhotos.length})`);
      console.log(`     - Reviews: ${currentReviews.length} → ${newReviews.length} (+${toAddReviews} new)`);
      if (currentPrice && newPrice) {
        console.log(`     - Price: ${currentPrice} → ${newPrice} (${newPrice > currentPrice ? '+' : ''}${newPrice - currentPrice})`);
      }
      if (currentRating && newRating) {
        console.log(`     - Rating: ${currentRating} → ${newRating} (${newRating > currentRating ? '+' : ''}${(newRating - currentRating).toFixed(1)})`);
      }
      console.log(`     - Review Count: ${currentReviewCount || 0} → ${newReviewCount} (+${toAddReviews})`);
    }

    console.log('\n✅ All scrapes simulated successfully!');
    console.log('\n💡 You can now view the changes in the Diff Tool by comparing the latest snapshots.');

  } catch (error) {
    console.error('❌ Error simulating scrapes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

simulateScrapes();

