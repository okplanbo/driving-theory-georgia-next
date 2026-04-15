'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleCheckbox } from '@/components/ui/checkbox';
import { UserStats, WeakQuestion, ExamHistoryEntry, ApiResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  BarChart3, 
  Star, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Clock
} from 'lucide-react';

export default function StatsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, preferences, updatePreferences } = useAuth();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/progress/stats?lang=${preferences.preferredLanguage}`);
        const data: ApiResponse<UserStats> = await response.json();

        if (data.success) {
          setStats(data.data!);
        } else {
          setError(data.error || 'Failed to load stats');
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [authLoading, isAuthenticated, router, preferences.preferredLanguage]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">
          {error || 'No stats available'}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Your Progress</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">
              {stats.totalPracticed}/{stats.totalQuestions}
            </div>
            <div className="text-xs text-muted-foreground">Practiced</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{stats.correctRate}%</div>
            <div className="text-xs text-muted-foreground">Correct Rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{stats.favoritesCount}</div>
            <div className="text-xs text-muted-foreground">Favorites</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <EyeOff className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.excludedCount}</div>
            <div className="text-xs text-muted-foreground">Excluded</div>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Practice Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-3 cursor-pointer">
            <SimpleCheckbox
              checked={preferences.prioritizeWeak}
              onCheckedChange={(checked) => 
                updatePreferences({ prioritizeWeak: checked })
              }
            />
            <div>
              <div className="font-medium">Prioritize weak questions</div>
              <div className="text-sm text-muted-foreground">
                Show questions you&apos;ve answered incorrectly more often in random mode
              </div>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Weak Questions */}
      {stats.weakQuestions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Weak Questions ({stats.weakQuestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.weakQuestions.slice(0, 10).map((item) => (
                <Link
                  key={item.ticketId}
                  href={`/practice?id=${item.ticketId}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm font-mono text-muted-foreground shrink-0">
                      #{item.ticketId}
                    </span>
                    <span className="text-sm truncate">
                      {item.questionPreview}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-red-500">
                      {item.wrongCount} wrong
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  </div>
                </Link>
              ))}
            </div>
            {stats.weakQuestions.length > 10 && (
              <div className="text-center mt-4">
                <span className="text-sm text-muted-foreground">
                  +{stats.weakQuestions.length - 10} more weak questions
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Exam History */}
      {stats.recentExams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    {exam.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">
                        {exam.correctCount}/{exam.totalCount}{' '}
                        <span className={cn(
                          'text-sm',
                          exam.passed ? 'text-green-600' : 'text-red-600'
                        )}>
                          {exam.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(exam.takenAt)} • {formatDuration(exam.durationSeconds)}
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    {Math.round((exam.correctCount / exam.totalCount) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {stats.totalPracticed === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No progress yet</h3>
            <p className="text-muted-foreground mb-4">
              Start practicing to see your statistics here.
            </p>
            <Link href="/practice">
              <Button>Start Practice</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
