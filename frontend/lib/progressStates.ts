/**
 * Unified progress state model for scraping and ingestion workflow
 * 
 * This provides a clear state machine that maps backend events to user-visible states
 */

export type ProgressState =
  | 'ready'              // 🟢 Idle, waiting for user input
  | 'scrape_initiated'   // 🟡 User triggered manual scrape
  | 'scraping'            // 🟠 Apify run in progress
  | 'processing'          // 🟣 Data retrieved, parsing or transforming
  | 'ingesting'           // 🟩 Database insert or update running
  | 'updating_ui'         // 🟦 New data being pushed to the frontend store
  | 'completed'           // ✅ Ingestion finished, UI refreshed
  | 'error';              // 🔴 Scrape or ingestion failed

export interface ProgressStateConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  animation?: 'pulse' | 'spin' | 'fade' | 'none';
  description: string;
}

export const PROGRESS_STATE_CONFIG: Record<ProgressState, ProgressStateConfig> = {
  ready: {
    label: 'Ready',
    icon: '🟢',
    color: 'var(--color-text-muted)',
    bgColor: 'var(--color-surface-elevated)',
    borderColor: 'var(--color-border)',
    animation: 'none',
    description: 'Idle, waiting for user input',
  },
  scrape_initiated: {
    label: 'Scrape Initiated',
    icon: '🟡',
    color: 'var(--color-primary)',
    bgColor: 'rgba(0, 159, 61, 0.2)', // #009F3D with opacity
    borderColor: 'rgba(0, 159, 61, 0.3)',
    animation: 'pulse',
    description: 'User triggered manual scrape',
  },
  scraping: {
    label: 'Scraping',
    icon: '🟠',
    color: 'var(--color-primary)',
    bgColor: 'rgba(0, 159, 61, 0.2)', // #009F3D with opacity
    borderColor: 'rgba(0, 159, 61, 0.3)',
    animation: 'spin',
    description: 'Apify run in progress',
  },
  processing: {
    label: 'Processing',
    icon: '🟣',
    color: '#a78bfa',
    bgColor: 'rgba(167, 139, 250, 0.2)',
    borderColor: 'rgba(167, 139, 250, 0.3)',
    animation: 'spin',
    description: 'Data retrieved, parsing or transforming',
  },
  ingesting: {
    label: 'Ingesting',
    icon: '🟩',
    color: 'var(--color-success)',
    bgColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    animation: 'spin',
    description: 'Database insert or update running',
  },
  updating_ui: {
    label: 'Updating UI',
    icon: '🟦',
    color: 'var(--color-info)',
    bgColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    animation: 'fade',
    description: 'New data being pushed to the frontend store',
  },
  completed: {
    label: 'Completed',
    icon: '✅',
    color: 'var(--color-success)',
    bgColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    animation: 'fade',
    description: 'Ingestion finished, UI refreshed',
  },
  error: {
    label: 'Error',
    icon: '🔴',
    color: 'var(--color-error)',
    bgColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    animation: 'none',
    description: 'Scrape or ingestion failed',
  },
};

/**
 * Determine progress state from backend data
 */
export function determineProgressState(
  scrapeStatus: 'pending' | 'running' | 'completed' | 'failed' | null | undefined,
  lastScrapedAt: string | null | undefined,
  isScraping: boolean,
  jobStatuses?: {
    'rooms-scraper'?: { status: string };
    'reviews-scraper'?: { status: string };
    'ingestion'?: { status: string };
  }
): ProgressState {
  // Error state takes priority
  if (scrapeStatus === 'failed') {
    return 'error';
  }

  // HIGHEST PRIORITY: If scrape_status is completed, always show completed
  if (scrapeStatus === 'completed') {
    return 'completed';
  }

  // Check job statuses for more granular state
  if (jobStatuses) {
    const ingestionStatus = jobStatuses['ingestion']?.status;
    const reviewsStatus = jobStatuses['reviews-scraper']?.status;
    const roomsStatus = jobStatuses['rooms-scraper']?.status;

    // If ingestion is completed, we're done
    if (ingestionStatus === 'completed') {
      return 'completed';
    }
    
    // If ingestion is running, show ingesting
    if (ingestionStatus === 'running') {
      return 'ingesting';
    }
    
    // If reviews scraper is running, show processing
    if (reviewsStatus === 'running') {
      return 'processing';
    }
    
    // If rooms scraper is running, show scraping
    if (roomsStatus === 'running') {
      return 'scraping';
    }
    
    // If all jobs are completed (or no jobs exist), check scrape_status
    const allJobsCompleted = (
      (!roomsStatus || roomsStatus === 'completed' || roomsStatus === 'failed') &&
      (!reviewsStatus || reviewsStatus === 'completed' || reviewsStatus === 'failed') &&
      (!ingestionStatus || ingestionStatus === 'completed' || ingestionStatus === 'failed')
    );
    
    if (allJobsCompleted && lastScrapedAt) {
      return 'completed';
    }
  }

  // If actively scraping (frontend state), show scraping
  if (isScraping) {
    return 'scraping';
  }

  // If status is running and we have last_scraped_at, check if jobs are done
  if (scrapeStatus === 'running' && lastScrapedAt && !isScraping) {
    if (jobStatuses) {
      const allJobsDone = (
        (!jobStatuses['rooms-scraper'] || jobStatuses['rooms-scraper'].status === 'completed' || jobStatuses['rooms-scraper'].status === 'failed') &&
        (!jobStatuses['reviews-scraper'] || jobStatuses['reviews-scraper'].status === 'completed' || jobStatuses['reviews-scraper'].status === 'failed') &&
        (!jobStatuses['ingestion'] || jobStatuses['ingestion'].status === 'completed' || jobStatuses['ingestion'].status === 'failed')
      );
      if (allJobsDone) {
        return 'completed';
      }
    }
    // If scrape was more than 20 minutes ago and we're not actively scraping, assume completed
    const lastScraped = new Date(lastScrapedAt);
    const now = new Date();
    const minutesSinceScrape = (now.getTime() - lastScraped.getTime()) / (1000 * 60);
    if (minutesSinceScrape > 20) {
      return 'completed';
    }
    return 'scraping';
  }

  // If status is running and we're actively scraping, show scraping
  if (scrapeStatus === 'running') {
    return 'scraping';
  }

  if (scrapeStatus === 'pending' || !lastScrapedAt) {
    return 'ready';
  }

  // Default: if we have last_scraped_at but no clear status, assume completed
  return 'completed';
}

/**
 * Get animation class for a progress state
 */
export function getAnimationClass(state: ProgressState): string {
  const config = PROGRESS_STATE_CONFIG[state];
  if (!config.animation || config.animation === 'none') {
    return '';
  }

  switch (config.animation) {
    case 'pulse':
      return 'animate-pulse';
    case 'spin':
      return 'animate-spin';
    case 'fade':
      return 'opacity-75';
    default:
      return '';
  }
}

