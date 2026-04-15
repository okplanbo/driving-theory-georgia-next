'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { ApiResponse } from '@/lib/types';

interface UseProgressReturn {
  favoriteIds: Set<number>;
  excludedIds: Set<number>;
  isLoading: boolean;
  toggleFavorite: (ticketId: number) => Promise<void>;
  toggleExcluded: (ticketId: number) => Promise<void>;
  recordAnswer: (ticketId: number, isCorrect: boolean) => Promise<void>;
  isFavorite: (ticketId: number) => boolean;
  isExcluded: (ticketId: number) => boolean;
  refresh: () => Promise<void>;
}

export function useProgress(): UseProgressReturn {
  const { isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const fetchProgress = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      setExcludedIds(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const [favResponse, exclResponse] = await Promise.all([
        fetch('/api/progress/favorites'),
        fetch('/api/progress/exclusions'),
      ]);

      const favData: ApiResponse<{ favoriteIds: number[] }> = await favResponse.json();
      const exclData: ApiResponse<{ excludedIds: number[] }> = await exclResponse.json();

      if (favData.success) {
        setFavoriteIds(new Set(favData.data?.favoriteIds));
      }
      if (exclData.success) {
        setExcludedIds(new Set(exclData.data?.excludedIds));
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const toggleFavorite = async (ticketId: number) => {
    if (!isAuthenticated) return;

    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });

    try {
      const response = await fetch('/api/progress/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });

      const data: ApiResponse<{ isFavorite: boolean }> = await response.json();
      if (data.success) {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (data.data?.isFavorite) {
            next.add(ticketId);
          } else {
            next.delete(ticketId);
          }
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert on error
      await fetchProgress();
    }
  };

  const toggleExcluded = async (ticketId: number) => {
    if (!isAuthenticated) return;

    // Optimistic update
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });

    try {
      const response = await fetch('/api/progress/exclusions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });

      const data: ApiResponse<{ isExcluded: boolean }> = await response.json();
      if (data.success) {
        setExcludedIds((prev) => {
          const next = new Set(prev);
          if (data.data?.isExcluded) {
            next.add(ticketId);
          } else {
            next.delete(ticketId);
          }
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to toggle exclusion:', error);
      // Revert on error
      await fetchProgress();
    }
  };

  const recordAnswer = async (ticketId: number, isCorrect: boolean) => {
    if (!isAuthenticated) return;

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, isCorrect }),
      });
    } catch (error) {
      console.error('Failed to record answer:', error);
    }
  };

  const isFavorite = (ticketId: number) => favoriteIds.has(ticketId);
  const isExcluded = (ticketId: number) => excludedIds.has(ticketId);

  return {
    favoriteIds,
    excludedIds,
    isLoading,
    toggleFavorite,
    toggleExcluded,
    recordAnswer,
    isFavorite,
    isExcluded,
    refresh: fetchProgress,
  };
}
