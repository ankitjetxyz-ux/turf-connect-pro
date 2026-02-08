import { useState, useEffect, useCallback, useRef } from 'react';
import { AnalyticsService } from '@/services/analyticsService';
import { AnalyticsData, DateRange } from '@/types';

/**
 * Configuration options for the useTurfAnalytics hook
 */
interface UseTurfAnalyticsOptions {
    turfId: string;
    dateRange: DateRange;
    refreshInterval?: number; // milliseconds, 0 to disable
    autoRefresh?: boolean; // Enable auto-refresh on mount
}

/**
 * Return type for the useTurfAnalytics hook
 */
interface UseTurfAnalyticsReturn {
    data: AnalyticsData | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    isRefetching: boolean;
}

/**
 * Custom React hook for fetching and managing turf analytics data
 * 
 * Features:
 * - Automatic data fetching on mount and when dependencies change
 * - Manual refetch capability
 * - Loading and error states
 * - Optional polling/refresh interval
 * - Cancellation of in-flight requests
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useTurfAnalytics({
 *   turfId: 'turf-123',
 *   dateRange: { startDate: new Date('2026-01-01'), endDate: new Date() },
 *   refreshInterval: 30000, // Refresh every 30 seconds
 * });
 * ```
 */
export function useTurfAnalytics({
    turfId,
    dateRange,
    refreshInterval = 0, // Disabled by default
    autoRefresh = true,
}: UseTurfAnalyticsOptions): UseTurfAnalyticsReturn {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);

    /**
     * Core fetch function
     */
    const fetchAnalytics = useCallback(async (isInitialLoad = false) => {
        // Validate inputs
        if (!turfId) {
            setError('Turf ID is required');
            setLoading(false);
            return;
        }

        if (!AnalyticsService.validateDateRange(dateRange)) {
            setError('Invalid date range');
            setLoading(false);
            return;
        }

        // Cancel previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        if (isInitialLoad) {
            setLoading(true);
        } else {
            setIsRefetching(true);
        }
        setError(null);

        try {
            const analyticsData = await AnalyticsService.fetchTurfAnalytics(
                turfId,
                dateRange
            );

            // Only update state if component is still mounted
            if (mountedRef.current) {
                setData(analyticsData);
                setError(null);
            }
        } catch (err) {
            // Ignore abort errors
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }

            const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';

            if (mountedRef.current) {
                setError(errorMessage);
                console.error('Analytics fetch error:', err);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
                setIsRefetching(false);
            }
        }
    }, [turfId, dateRange]);

    /**
     * Manual refetch function
     */
    const refetch = useCallback(async () => {
        await fetchAnalytics(false);
    }, [fetchAnalytics]);

    /**
     * Initial load effect
     */
    useEffect(() => {
        if (autoRefresh) {
            fetchAnalytics(true);
        }

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchAnalytics, autoRefresh]);

    /**
     * Polling effect
     */
    useEffect(() => {
        if (refreshInterval > 0) {
            pollingIntervalRef.current = setInterval(() => {
                fetchAnalytics(false);
            }, refreshInterval);

            return () => {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                }
            };
        }
    }, [refreshInterval, fetchAnalytics]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            mountedRef.current = false;

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    return {
        data,
        loading,
        error,
        refetch,
        isRefetching,
    };
}
