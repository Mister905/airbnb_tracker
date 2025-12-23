import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

// Load environment variables from root .env file
config({ path: path.join(__dirname, '..', '..', '.env') });

// Get database URLs
const localDatabaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/airbnb_tracker';
const productionDatabaseUrl = process.env.PRODUCTION_DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!productionDatabaseUrl) {
  console.error('❌ Error: PRODUCTION_DATABASE_URL or SUPABASE_DATABASE_URL must be set');
  console.error('   Set it in your .env file or as an environment variable');
  console.error('   Example: PRODUCTION_DATABASE_URL=postgresql://user:pass@host:5432/dbname');
  process.exit(1);
}

const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: localDatabaseUrl,
    },
  },
});

const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: productionDatabaseUrl,
    },
  },
});

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function syncSnapshotsToProduction() {
  try {
    console.log('🔄 Syncing simulated snapshots from local to production...\n');
    console.log('⚠️  WARNING: This will modify the production database!');
    console.log(`   Local DB: ${localDatabaseUrl.replace(/:[^:@]+@/, ':****@')}`);
    console.log(`   Production DB: ${productionDatabaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);

    // Get confirmation
    const answer = await question('Are you sure you want to proceed? (yes/no): ');
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      process.exit(0);
    }

    console.log('\n🔍 Finding simulated snapshots in local database...\n');

    // Get all listings with snapshots from local
    const localListings = await localPrisma.listing.findMany({
      include: {
        snapshots: {
          orderBy: { version: 'desc' },
          include: {
            photos: {
              orderBy: { order: 'asc' },
            },
            reviews: {
              orderBy: { date: 'desc' },
            },
            scrapeRun: true,
          },
        },
        trackedUrl: true,
      },
    });

    if (localListings.length === 0) {
      console.log('❌ No listings with snapshots found in local database.');
      process.exit(0);
    }

    console.log(`📋 Found ${localListings.length} listing(s) with snapshots.\n`);

    // For each listing, sync snapshots
    for (const localListing of localListings) {
      console.log(`\n📸 Processing listing: ${localListing.title || localListing.id}`);
      console.log(`   Local snapshots: ${localListing.snapshots.length}`);

      // Find or create listing in production
      let productionListing = await productionPrisma.listing.findFirst({
        where: {
          trackedUrl: {
            url: localListing.trackedUrl.url,
          },
        },
      });

      if (!productionListing) {
        // Find or create tracked URL
        let productionTrackedUrl = await productionPrisma.trackedUrl.findUnique({
          where: { url: localListing.trackedUrl.url },
        });

        if (!productionTrackedUrl) {
          // Get a userId from existing tracked URLs to use for the new one
          const existingTrackedUrl = await productionPrisma.trackedUrl.findFirst();
          if (!existingTrackedUrl) {
            console.log(`   ⚠️  No tracked URLs exist in production. Cannot determine userId. Skipping listing.`);
            console.log(`   💡 Tip: Create at least one tracked URL in production first.`);
            continue;
          }
          
          // Create the tracked URL using the same userId as existing ones
          productionTrackedUrl = await productionPrisma.trackedUrl.create({
            data: {
              url: localListing.trackedUrl.url,
              userId: existingTrackedUrl.userId,
              enabled: localListing.trackedUrl.enabled ?? true,
            },
          });
          console.log(`   ✓ Created tracked URL in production`);
        }

        // Create listing
        productionListing = await productionPrisma.listing.create({
          data: {
            trackedUrlId: productionTrackedUrl.id,
            airbnbId: localListing.airbnbId,
            title: localListing.title,
            description: localListing.description,
            location: localListing.location,
          },
        });
        console.log(`   ✓ Created listing in production`);
      } else {
        console.log(`   ✓ Listing exists in production`);
      }

      // Get existing snapshots in production
      const productionSnapshots = await productionPrisma.listingSnapshot.findMany({
        where: { listingId: productionListing.id },
        orderBy: { version: 'desc' },
      });

      const productionVersions = new Set(productionSnapshots.map(s => s.version));

      // Sync each snapshot
      for (const localSnapshot of localListing.snapshots) {
        // Skip if snapshot already exists in production
        if (productionVersions.has(localSnapshot.version)) {
          console.log(`   ⏭️  Snapshot version ${localSnapshot.version} already exists in production. Skipping.`);
          continue;
        }

        console.log(`   📸 Syncing snapshot version ${localSnapshot.version}...`);

        // Create snapshot
        const productionSnapshot = await productionPrisma.listingSnapshot.create({
          data: {
            listingId: productionListing.id,
            version: localSnapshot.version,
            description: localSnapshot.description,
            amenities: localSnapshot.amenities,
            price: localSnapshot.price,
            currency: localSnapshot.currency,
            rating: localSnapshot.rating,
            reviewCount: localSnapshot.reviewCount,
            createdAt: localSnapshot.createdAt,
          },
        });

        // Create photos
        if (localSnapshot.photos.length > 0) {
          await productionPrisma.photo.createMany({
            data: localSnapshot.photos.map((photo, index) => ({
              listingId: productionListing.id,
              snapshotId: productionSnapshot.id,
              url: photo.url,
              caption: photo.caption,
              order: index,
            })),
          });
          console.log(`      ✓ Synced ${localSnapshot.photos.length} photos`);
        }

        // Create reviews
        if (localSnapshot.reviews.length > 0) {
          await productionPrisma.review.createMany({
            data: localSnapshot.reviews.map((review) => ({
              listingId: productionListing.id,
              snapshotId: productionSnapshot.id,
              reviewId: review.reviewId,
              reviewerName: review.reviewerName,
              reviewerAvatar: review.reviewerAvatar,
              rating: review.rating,
              comment: review.comment,
              date: review.date,
            })),
            skipDuplicates: true, // Skip if reviewId already exists
          });
          console.log(`      ✓ Synced ${localSnapshot.reviews.length} reviews`);
        }

        // Create scrape run if it exists
        if (localSnapshot.scrapeRun) {
          await productionPrisma.scrapeRun.create({
            data: {
              trackedUrlId: productionListing.trackedUrlId,
              status: localSnapshot.scrapeRun.status,
              error: localSnapshot.scrapeRun.error,
              startedAt: localSnapshot.scrapeRun.startedAt,
              completedAt: localSnapshot.scrapeRun.completedAt,
              apifyRunId: localSnapshot.scrapeRun.apifyRunId,
              snapshotId: productionSnapshot.id,
            },
          });
          console.log(`      ✓ Synced scrape run`);
        }

        console.log(`      ✅ Snapshot version ${localSnapshot.version} synced successfully`);
      }
    }

    console.log('\n✅ Sync complete!');
    console.log('\n💡 Note: Make sure the tracked URLs exist in production before syncing.');
    console.log('   The script will skip listings if their tracked URLs are not found in production.');

  } catch (error) {
    console.error('❌ Error syncing snapshots:', error);
    throw error;
  } finally {
    await localPrisma.$disconnect();
    await productionPrisma.$disconnect();
    rl.close();
  }
}

syncSnapshotsToProduction();

