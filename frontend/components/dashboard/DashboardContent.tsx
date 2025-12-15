'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  fetchTrackedUrls,
  createTrackedUrl,
  deleteTrackedUrl,
  TrackedUrl,
} from '@/lib/store/listingsSlice';
import { api } from '@/lib/api';
import * as Dialog from '@radix-ui/react-dialog';
import Button from '@/components/ui/Button';
import { ProgressState, determineProgressState } from '@/lib/progressStates';
import { formatDate, formatRelativeTime } from '@/lib/dateUtils';

type SortField = 'url' | 'created_at' | 'last_scraped_at';
type SortDirection = 'asc' | 'desc';

export default function DashboardContent() {
  const dispatch = useAppDispatch();
  const { trackedUrls, loading } = useAppSelector((state) => state.listings);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [scrapingUrlIds, setScrapingUrlIds] = useState<Set<string>>(new Set());
  const [scrapeRuns, setScrapeRuns] = useState<Record<string, any[]>>({});
  const [isScrapingAll, setIsScrapingAll] = useState(false);

  useEffect(() => {
    dispatch(fetchTrackedUrls());
  }, [dispatch]);

  // Fetch scrape runs for all URLs
  useEffect(() => {
    const fetchScrapeRuns = async () => {
      const runs: Record<string, any[]> = {};
      for (const url of trackedUrls) {
        try {
          const status = await api.get(`/api/scrape-status/${url.id}`) as any[];
          runs[url.id] = status || [];
        } catch (error) {
          console.error(`Failed to fetch scrape status for ${url.id}:`, error);
          runs[url.id] = [];
        }
      }
      setScrapeRuns(runs);
    };

    if (trackedUrls.length > 0) {
      fetchScrapeRuns();
      // Poll for updates every 5 seconds
      const interval = setInterval(fetchScrapeRuns, 5000);
      return () => clearInterval(interval);
    }
  }, [trackedUrls]);

  const handleAddUrl = async () => {
    const urlToAdd = newUrl.trim();
    if (!urlToAdd) {
      alert('Please enter a valid URL');
      return;
    }
    
    try {
      await dispatch(createTrackedUrl({ url: urlToAdd, enabled: true })).unwrap();
      setNewUrl('');
      setIsDialogOpen(false);
      dispatch(fetchTrackedUrls());
    } catch (error: any) {
      console.error('Failed to add URL:', error);
      const errorMessage = error?.message || error?.error || 'Unknown error';
      alert(`Failed to add URL: ${errorMessage}`);
      
      if (error?.statusCode === 401) {
        localStorage.removeItem('backend_jwt');
        window.location.href = '/login';
      }
    }
  };

  const handleDelete = async (url: TrackedUrl) => {
    if (!confirm('Are you sure you want to delete this tracked URL?')) return;
    
    try {
      await dispatch(deleteTrackedUrl(url.id)).unwrap();
      dispatch(fetchTrackedUrls());
    } catch (error) {
      console.error('Failed to delete URL:', error);
    }
  };

  const handleScrape = async (url: TrackedUrl) => {
    try {
      setScrapingUrlIds((prev) => new Set(prev).add(url.id));
      await api.post('/api/manual-scrape', { trackedUrlId: url.id });
      
      // Poll for status
      const checkStatus = async () => {
        try {
          const status = await api.get(`/api/scrape-status/${url.id}`) as any[];
          const latest = status?.[0];
          
          if (latest && (latest.status === 'completed' || latest.status === 'failed')) {
            setScrapingUrlIds((prev) => {
              const next = new Set(prev);
              next.delete(url.id);
              return next;
            });
            dispatch(fetchTrackedUrls());
          } else {
            setTimeout(checkStatus, 2000);
          }
        } catch (error) {
          console.error('Failed to check scrape status:', error);
          setScrapingUrlIds((prev) => {
            const next = new Set(prev);
            next.delete(url.id);
            return next;
          });
        }
      };
      
      setTimeout(checkStatus, 2000);
    } catch (error) {
      console.error('Failed to start scrape:', error);
      setScrapingUrlIds((prev) => {
        const next = new Set(prev);
        next.delete(url.id);
        return next;
      });
    }
  };

  // Enhance TrackedUrl with computed fields
  const enhancedUrls: TrackedUrl[] = trackedUrls.map((url) => {
    const latestSnapshot = url.listing?.snapshots?.[0];
    const latestScrapeRun = scrapeRuns[url.id]?.[0];
    
    return {
      ...url,
      promotional_title: url.listing?.title || undefined,
      scrape_status: latestScrapeRun?.status || (latestSnapshot ? 'completed' : 'pending'),
      last_scraped_at: latestSnapshot?.createdAt || latestScrapeRun?.completedAt || null,
    };
  });

  // Calculate enabled URLs that aren't currently being scraped
  const enabledUrlsCount = enhancedUrls.filter(
    (url) => url.enabled && !scrapingUrlIds.has(url.id)
  ).length;

  const handleScrapeAll = async () => {
    if (enhancedUrls.length === 0) {
      alert('No URLs to scrape');
      return;
    }

    // Filter to only enabled URLs that aren't already being scraped
    const urlsToScrape = enhancedUrls.filter(
      (url) => url.enabled && !scrapingUrlIds.has(url.id)
    );

    if (urlsToScrape.length === 0) {
      alert('No enabled URLs available to scrape, or all URLs are already being scraped');
      return;
    }

    if (!confirm(`Start scraping ${urlsToScrape.length} listing${urlsToScrape.length > 1 ? 's' : ''}?`)) {
      return;
    }

    setIsScrapingAll(true);

    // Start scrapes with a small delay between each to avoid overwhelming the API
    for (let i = 0; i < urlsToScrape.length; i++) {
      const url = urlsToScrape[i];
      
      // Add delay between requests (except for the first one)
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
      }

      try {
        setScrapingUrlIds((prev) => new Set(prev).add(url.id));
        await api.post('/api/manual-scrape', { trackedUrlId: url.id });
        
        // Start polling for this URL
        const checkStatus = async () => {
          try {
            const status = await api.get(`/api/scrape-status/${url.id}`) as any[];
            const latest = status?.[0];
            
            if (latest && (latest.status === 'completed' || latest.status === 'failed')) {
              setScrapingUrlIds((prev) => {
                const next = new Set(prev);
                next.delete(url.id);
                return next;
              });
              dispatch(fetchTrackedUrls());
            } else {
              setTimeout(checkStatus, 2000);
            }
          } catch (error) {
            console.error(`Failed to check scrape status for ${url.id}:`, error);
            setScrapingUrlIds((prev) => {
              const next = new Set(prev);
              next.delete(url.id);
              return next;
            });
          }
        };
        
        setTimeout(checkStatus, 2000);
      } catch (error) {
        console.error(`Failed to start scrape for ${url.id}:`, error);
        setScrapingUrlIds((prev) => {
          const next = new Set(prev);
          next.delete(url.id);
          return next;
        });
      }
    }

    setIsScrapingAll(false);
  };

  const getProgressState = (url: TrackedUrl): ProgressState => {
    return determineProgressState(
      url.scrape_status || null,
      url.last_scraped_at || null,
      scrapingUrlIds.has(url.id),
      {} // jobStatuses not available from current API
    );
  };

  const getStatus = (url: TrackedUrl): 'Pending' | 'In Progress' | 'Completed' | 'Error' => {
    const state = getProgressState(url);
    switch (state) {
      case 'ready':
        return 'Pending';
      case 'scrape_initiated':
      case 'scraping':
      case 'processing':
      case 'ingesting':
      case 'updating_ui':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Pending';
    }
  };

  const getStatusBadge = (status: 'Pending' | 'In Progress' | 'Completed' | 'Error') => {
    const styles = {
      Pending: { backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#fbbf24', borderColor: 'rgba(234, 179, 8, 0.3)' },
      'In Progress': { backgroundColor: 'rgba(0, 159, 61, 0.2)', color: 'var(--color-primary)', borderColor: 'rgba(0, 159, 61, 0.3)' },
      Completed: { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.3)' },
      Error: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' },
    };

    const icons = {
      Pending: '🟡',
      'In Progress': '🟠',
      Completed: '✅',
      Error: '🔴',
    };

    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
        style={styles[status]}
      >
        <span className="mr-1.5">{icons[status]}</span>
        {status}
      </span>
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedUrls = [...enhancedUrls].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'url':
        aValue = (a.promotional_title || a.url).toLowerCase();
        bValue = (b.promotional_title || b.url).toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'last_scraped_at':
        aValue = a.last_scraped_at ? new Date(a.last_scraped_at).getTime() : 0;
        bValue = b.last_scraped_at ? new Date(b.last_scraped_at).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 ml-1" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg
        className={`w-4 h-4 ml-1 ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
        style={{ color: 'var(--color-text-primary)' }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl heading-primary">Dashboard</h1>
        <div className="flex items-center gap-3">
          {enhancedUrls.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleScrapeAll}
              disabled={isScrapingAll || scrapingUrlIds.size > 0 || enabledUrlsCount === 0}
            >
              {isScrapingAll ? 'Scraping All...' : `Scrape All (${enabledUrlsCount})`}
            </Button>
          )}
          <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Dialog.Trigger asChild>
              <Button variant="primary">Add Listing URL</Button>
            </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} />
            <Dialog.Content className="card fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 w-full max-w-md">
              <Dialog.Title className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Add New Listing URL
              </Dialog.Title>
              <div className="space-y-4">
                <input
                  type="url"
                  placeholder="https://www.airbnb.com/rooms/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="input w-full"
                  required
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrl();
                    }
                  }}
                />
                <div className="flex justify-end space-x-2">
                  <Dialog.Close asChild>
                    <Button variant="secondary" type="button">Cancel</Button>
                  </Dialog.Close>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddUrl();
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
        </div>
      ) : sortedUrls.length === 0 ? (
        <div className="card rounded-lg p-12 text-center">
          <p style={{ color: 'var(--color-text-secondary)' }} className="mb-4">
            No URLs tracked yet. Add your first URL to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 p-4 rounded-lg border" style={{ 
            backgroundColor: 'var(--color-surface-elevated)', 
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)'
          }}>
            <p className="text-sm">
              <strong style={{ color: 'var(--color-text-primary)' }}>Note:</strong> The <strong>Status</strong> column will show as "Pending" and the <strong>Listing Title</strong> column will be empty until you perform the initial scrape for each listing. Click "Scrape" on a listing or use "Scrape All" to get started.
            </p>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
                <tr>
                  <th
                    className="w-[35%] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onClick={() => handleSort('url')}
                  >
                    <div className="flex items-center">
                      Listing Title
                      <SortIcon field="url" />
                    </div>
                  </th>
                  <th className="w-[15%] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                    Status
                  </th>
                  <th
                    className="w-[15%] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      Added
                      <SortIcon field="created_at" />
                    </div>
                  </th>
                  <th
                    className="w-[15%] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onClick={() => handleSort('last_scraped_at')}
                  >
                    <div className="flex items-center">
                      Last Scraped
                      <SortIcon field="last_scraped_at" />
                    </div>
                  </th>
                  <th className="w-[20%] px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ borderColor: 'var(--color-border)' }}>
                {sortedUrls.map((url) => {
                  const status = getStatus(url);
                  const isScraping = scrapingUrlIds.has(url.id);

                  return (
                    <tr
                      key={url.id}
                      className="transition-colors"
                      style={{ borderTop: '1px solid var(--color-border)' }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 min-w-0">
                          {url.promotional_title ? (
                            <>
                              <a
                                href={url.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium truncate transition-colors"
                                style={{ color: 'var(--color-text-primary)' }}
                                title={url.promotional_title}
                              >
                                {url.promotional_title}
                              </a>
                              <a
                                href={url.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs truncate transition-colors"
                                style={{ color: 'var(--color-text-secondary)' }}
                                title={url.url}
                              >
                                {url.url}
                              </a>
                            </>
                          ) : (
                            <>
                              <span className="italic truncate" style={{ color: 'var(--color-text-muted)' }}>
                                {isScraping ? 'Fetching title...' : 'No title yet'}
                              </span>
                              <a
                                href={url.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs truncate transition-colors"
                                style={{ color: 'var(--color-primary)' }}
                                title={url.url}
                              >
                                {url.url}
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 min-w-0">
                          {getStatusBadge(status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm truncate" style={{ color: 'var(--color-text-secondary)' }} title={formatDate(url.createdAt)}>
                        {formatDate(url.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm min-w-0">
                        {url.last_scraped_at ? (
                          <div className="truncate" title={`${formatRelativeTime(url.last_scraped_at)} - ${formatDate(url.last_scraped_at)}`}>
                            <div className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                              {formatRelativeTime(url.last_scraped_at)}
                            </div>
                            <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                              {formatDate(url.last_scraped_at)}
                            </div>
                          </div>
                        ) : (
                          <span className="italic" style={{ color: 'var(--color-text-muted)' }}>Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleScrape(url)}
                            disabled={isScraping}
                            style={{ color: 'var(--color-primary)' }}
                            className="btn-secondary-primary"
                          >
                            {isScraping ? 'Scraping...' : 'Scrape'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(url)}
                            disabled={isScraping}
                            style={{ color: 'var(--color-error)' }}
                            className="btn-ghost-error"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
