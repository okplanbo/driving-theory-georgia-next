'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Star,
  ArrowRight,
  Shuffle,
  BookOpen
} from 'lucide-react';
import { ApiResponse } from '@/lib/types';

interface ExcludedQuestion {
  ticketId: number;
  questionPreview: string;
  imageUrl: string | null;
}

const PAGE_SIZE = 100;

export default function ExcludedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, preferences } = useAuth();

  const [excluded, setExcluded] = useState<ExcludedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchExcluded = async (pageToFetch = 1) => {
      try {
        setPageLoading(true);
        // API expected to support pagination via page & limit. Adjust if your API uses offset.
        const response = await fetch(
          `/api/progress/exclusions?includeQuestions=true&lang=${preferences.preferredLanguage}&page=${pageToFetch}&limit=${PAGE_SIZE}`
        );
        const data: ApiResponse<{ questions: ExcludedQuestion[]; total?: number }> = await response.json();

        if (data.success) {
          setExcluded(data.data!.questions || []);
          // If API provides total count use it, otherwise infer (could be null)
          setTotal(data.data!.total ?? null);
        } else {
          setExcluded([]);
          setTotal(0);
        }
      } catch (err) {
        console.error('Error fetching excluded questions:', err);
        setExcluded([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
        setPageLoading(false);
      }
    };

    fetchExcluded(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, router, preferences.preferredLanguage, page]);

  const handleRandomExcluded = () => {
    if (excluded.length === 0) return;
    // If total is known and greater than current page size, we could fetch a truly random item from the server.
    // For simplicity pick random from currently loaded page.
    const randomIndex = Math.floor(Math.random() * excluded.length);
    router.push(`/practice?id=${excluded[randomIndex].ticketId}`);
  };

  const totalCount = total ?? null;
  const startIndex = (page - 1) * PAGE_SIZE + 1;
  const endIndex = startIndex + excluded.length - 1;

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const canPrev = page > 1;
  const canNext = totalCount === null ? excluded.length === PAGE_SIZE : endIndex < (totalCount || 0);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          Excluded Questions
        </h1>
        <div className="flex items-center gap-2">
          {excluded.length > 0 && (
            <Button onClick={handleRandomExcluded} variant="outline" size="sm">
              <Shuffle className="w-4 h-4 mr-2" />
              Random
            </Button>
          )}
        </div>
      </div>

      {excluded.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No excluded questions</h3>
            <p className="text-muted-foreground mb-4">
              You haven't excluded any questions yet.
            </p>
            <Link href="/practice">
              <Button>
                <BookOpen className="w-4 h-4 mr-2" />
                Start Practice
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Showing {startIndex}-{endIndex}
              {totalCount !== null ? ` of ${totalCount}` : ''} excluded question{(totalCount ?? excluded.length) !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {excluded.map((item) => (
                <Link
                  key={item.ticketId}
                  href={`/practice?id=${item.ticketId}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                    <span className="text-sm font-mono text-muted-foreground shrink-0">
                      #{item.ticketId}
                    </span>
                    <span className="text-sm truncate">
                      {item.questionPreview}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {pageLoading ? 'Loading page...' : null}
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev || pageLoading}>
                  Prev
                </Button>
                <div className="px-3 text-sm">
                  Page {page}
                </div>
                <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!canNext || pageLoading}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
