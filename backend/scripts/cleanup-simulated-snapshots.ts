import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env file
config({ path: path.join(__dirname, '..', '..', '.env') });

const prisma = new PrismaClient();

// Parse command line arguments
const hoursArg = process.argv[2];
const versionArg = process.argv[3];

async function cleanupSimulatedSnapshots(hoursWindow?: number, minVersion?: number) {
  try {
    console.log('🧹 Cleaning up simulated snapshots...\n');

    if (hoursWindow) {
      console.log(`📅 Using time window: last ${hoursWindow} hours`);
    }
    if (minVersion) {
      console.log(`📅 Deleting snapshots with version >= ${minVersion}`);
    }
    if (!hoursWindow && !minVersion) {
      console.log(`📅 Using default time window: last 24 hours`);
    }
    console.log('');

    // Get all listings
    const listings = await prisma.listing.findMany({
      include: {
        snapshots: {
          orderBy: { version: 'desc' },
          include: {
            photos: true,
            reviews: true,
            scrapeRun: true,
          },
        },
      },
    });

    if (listings.length === 0) {
      console.log('❌ No listings found.');
      process.exit(0);
    }

    console.log(`📋 Found ${listings.length} listing(s).\n`);

    let totalDeleted = 0;

    for (const listing of listings) {
      if (listing.snapshots.length === 0) {
        continue;
      }

      console.log(`\n📸 Processing listing: ${listing.title || listing.id}`);
      console.log(`   Total snapshots: ${listing.snapshots.length}`);

      // Find simulated snapshots based on criteria
      let simulatedSnapshots = listing.snapshots;

      // Filter by version if specified
      if (minVersion !== undefined) {
        simulatedSnapshots = simulatedSnapshots.filter(
          (snapshot) => snapshot.version >= minVersion
        );
      }

      // Filter by time window if specified (or use default 24 hours)
      const timeWindow = hoursWindow || 24;
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - timeWindow * 60 * 60 * 1000);

      if (!minVersion) {
        // Only apply time filter if not filtering by version
        simulatedSnapshots = simulatedSnapshots.filter((snapshot) => {
          // Check if snapshot has a scrape run that was completed within time window
          const hasRecentScrapeRun =
            snapshot.scrapeRun &&
            snapshot.scrapeRun.status === 'completed' &&
            snapshot.scrapeRun.completedAt &&
            new Date(snapshot.scrapeRun.completedAt) > cutoffTime;

          // Also check if snapshot was created within time window
          const isRecent = new Date(snapshot.createdAt) > cutoffTime;

          return hasRecentScrapeRun || isRecent;
        });
      }

      if (simulatedSnapshots.length === 0) {
        const criteria = minVersion
          ? `version >= ${minVersion}`
          : `created in last ${timeWindow} hours`;
        console.log(`   ⚠️  No simulated snapshots found (${criteria})`);
        continue;
      }

      console.log(`   Found ${simulatedSnapshots.length} simulated snapshot(s) to delete:`);
      simulatedSnapshots.forEach((snapshot) => {
        console.log(`     - Version ${snapshot.version} (created: ${new Date(snapshot.createdAt).toLocaleString()})`);
      });

      // Delete each simulated snapshot
      for (const snapshot of simulatedSnapshots) {
        console.log(`\n   🗑️  Deleting snapshot version ${snapshot.version}...`);

        // Delete associated scrape run first (has unique constraint)
        if (snapshot.scrapeRun) {
          await prisma.scrapeRun.delete({
            where: { id: snapshot.scrapeRun.id },
          });
          console.log(`      ✓ Deleted scrape run`);
        }

        // Delete associated photos
        const photoCount = snapshot.photos.length;
        if (photoCount > 0) {
          await prisma.photo.deleteMany({
            where: { snapshotId: snapshot.id },
          });
          console.log(`      ✓ Deleted ${photoCount} photo(s)`);
        }

        // Delete associated reviews
        const reviewCount = snapshot.reviews.length;
        if (reviewCount > 0) {
          await prisma.review.deleteMany({
            where: { snapshotId: snapshot.id },
          });
          console.log(`      ✓ Deleted ${reviewCount} review(s)`);
        }

        // Delete the snapshot itself
        await prisma.listingSnapshot.delete({
          where: { id: snapshot.id },
        });
        console.log(`      ✓ Deleted snapshot`);

        totalDeleted++;
      }
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Deleted ${totalDeleted} simulated snapshot(s) and their associated data.`);

    if (totalDeleted === 0) {
      console.log(`\n💡 Tip: If no snapshots were deleted, try:`);
      console.log(`   - Increasing the time window: npm run cleanup:snapshots 48`);
      console.log(`   - Deleting by version: npm run cleanup:snapshots 0 4 (deletes version >= 4)`);
    }

  } catch (error) {
    console.error('❌ Error cleaning up snapshots:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
// Usage: npm run cleanup:snapshots [hours] [minVersion]
// Examples:
//   npm run cleanup:snapshots           (last 24 hours, default)
//   npm run cleanup:snapshots 48        (last 48 hours)
//   npm run cleanup:snapshots 0 4       (all snapshots with version >= 4)
//   npm run cleanup:snapshots 72 2      (last 72 hours AND version >= 2)
let hoursWindow: number | undefined;
let minVersion: number | undefined;

if (hoursArg) {
  const hours = parseInt(hoursArg, 10);
  if (!isNaN(hours) && hours >= 0) {
    hoursWindow = hours;
  }
}

if (versionArg) {
  const version = parseInt(versionArg, 10);
  if (!isNaN(version) && version > 0) {
    minVersion = version;
  }
}

cleanupSimulatedSnapshots(hoursWindow, minVersion);

