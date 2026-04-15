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

interface FavoriteQuestion {
  ticketId: number;
  questionPreview: string;
  imageUrl: string | null;
}

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, preferences } = useAuth();

  const [favorites, setFavorites] = useState<FavoriteQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchFavorites = async () => {
      try {
        const response = await fetch(
          `/api/progress/favorites?includeQuestions=true&lang=${preferences.preferredLanguage}`
        );
        const data: ApiResponse<{ questions: FavoriteQuestion[] }> = await response.json();

        if (data.success) {
          setFavorites(data.data!.questions || []);
        }
      } catch (err) {
        console.error('Error fetching favorites:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [authLoading, isAuthenticated, router, preferences.preferredLanguage]);

  const handleRandomFavorite = () => {
    if (favorites.length === 0) return;
    const randomIndex = Math.floor(Math.random() * favorites.length);
    router.push(`/practice?id=${favorites[randomIndex].ticketId}`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          Favorites
        </h1>
        {favorites.length > 0 && (
          <Button onClick={handleRandomFavorite} variant="outline" size="sm">
            <Shuffle className="w-4 h-4 mr-2" />
            Random
          </Button>
        )}
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-4">
              Click the star icon on any question to add it to your favorites.
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
              {favorites.length} question{favorites.length !== 1 ? 's' : ''} saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {favorites.map((item) => (
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
