-- CreateTable
CREATE TABLE "TrackedUrl" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackedUrl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "trackedUrlId" TEXT NOT NULL,
    "airbnbId" TEXT,
    "title" TEXT,
    "description" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingSnapshot" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "description" TEXT,
    "amenities" JSONB,
    "price" DOUBLE PRECISION,
    "currency" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "snapshotId" TEXT,
    "reviewId" TEXT NOT NULL,
    "reviewerName" TEXT,
    "reviewerAvatar" TEXT,
    "rating" INTEGER,
    "comment" TEXT,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "snapshotId" TEXT,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapeRun" (
    "id" TEXT NOT NULL,
    "trackedUrlId" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "apifyRunId" TEXT,
    "snapshotId" TEXT,

    CONSTRAINT "ScrapeRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackedUrl_url_key" ON "TrackedUrl"("url");

-- CreateIndex
CREATE INDEX "TrackedUrl_userId_idx" ON "TrackedUrl"("userId");

-- CreateIndex
CREATE INDEX "TrackedUrl_enabled_idx" ON "TrackedUrl"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_trackedUrlId_key" ON "Listing"("trackedUrlId");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_airbnbId_key" ON "Listing"("airbnbId");

-- CreateIndex
CREATE INDEX "Listing_airbnbId_idx" ON "Listing"("airbnbId");

-- CreateIndex
CREATE INDEX "Listing_trackedUrlId_idx" ON "Listing"("trackedUrlId");

-- CreateIndex
CREATE INDEX "ListingSnapshot_listingId_createdAt_idx" ON "ListingSnapshot"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "ListingSnapshot_createdAt_idx" ON "ListingSnapshot"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ListingSnapshot_listingId_version_key" ON "ListingSnapshot"("listingId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Review_reviewId_key" ON "Review"("reviewId");

-- CreateIndex
CREATE INDEX "Review_listingId_idx" ON "Review"("listingId");

-- CreateIndex
CREATE INDEX "Review_snapshotId_idx" ON "Review"("snapshotId");

-- CreateIndex
CREATE INDEX "Review_date_idx" ON "Review"("date");

-- CreateIndex
CREATE INDEX "Photo_listingId_idx" ON "Photo"("listingId");

-- CreateIndex
CREATE INDEX "Photo_snapshotId_idx" ON "Photo"("snapshotId");

-- CreateIndex
CREATE INDEX "Photo_order_idx" ON "Photo"("order");

-- CreateIndex
CREATE UNIQUE INDEX "ScrapeRun_snapshotId_key" ON "ScrapeRun"("snapshotId");

-- CreateIndex
CREATE INDEX "ScrapeRun_status_idx" ON "ScrapeRun"("status");

-- CreateIndex
CREATE INDEX "ScrapeRun_startedAt_idx" ON "ScrapeRun"("startedAt");

-- CreateIndex
CREATE INDEX "ScrapeRun_trackedUrlId_idx" ON "ScrapeRun"("trackedUrlId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_trackedUrlId_fkey" FOREIGN KEY ("trackedUrlId") REFERENCES "TrackedUrl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingSnapshot" ADD CONSTRAINT "ListingSnapshot_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ListingSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ListingSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapeRun" ADD CONSTRAINT "ScrapeRun_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ListingSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
