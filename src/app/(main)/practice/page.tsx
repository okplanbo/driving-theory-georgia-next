'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { QuestionCard } from '@/components/QuestionCard';
import { GuestWarningBanner } from '@/components/GuestWarningBanner';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { ApiResponse, Question } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { BASE_QUESTION_COUNT } from '@/constants';

// Loading fallback component
function PracticeLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

// Inner component that uses useSearchParams
function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, preferences } = useAuth();
  const { isFavorite, isExcluded, toggleFavorite, toggleExcluded, recordAnswer } = useProgress();

  const [question, setQuestion] = useState<Question | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(BASE_QUESTION_COUNT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get question ID from URL or default to 1
  const questionId = parseInt(searchParams.get('id') || '1', 10);

  // Fetch a specific question
  const fetchQuestion = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/questions/${id}`);
      const data: ApiResponse<Question> = await response.json();

      if (data.success) {
        setQuestion(data.data!);
      } else {
        setError(data.error || 'Failed to load question');
      }
    } catch (err) {
      console.error('Error fetching question:', err);
      setError('Failed to load question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch random question
  const fetchRandomQuestion = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/questions/random');
      const data: ApiResponse<Question> = await response.json();

      if (data.success) {
        setQuestion(data.data!);
        // Update URL without triggering navigation
        router.replace(`/practice?id=${data.data!.ticket_id}`, { scroll: false });
      } else {
        setError(data.error || 'Failed to load question');
      }
    } catch (err) {
      console.error('Error fetching random question:', err);
      setError('Failed to load question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Initial load
  useEffect(() => {
    if (!authLoading) {
      fetchQuestion(questionId);
    }
  }, [questionId, fetchQuestion, authLoading]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (question && question.ticket_id < totalQuestions) {
      router.push(`/practice?id=${question.ticket_id + 1}`);
    }
  }, [question, totalQuestions, router]);

  const handlePrevious = useCallback(() => {
    if (question && question.ticket_id > 1) {
      router.push(`/practice?id=${question.ticket_id - 1}`);
    }
  }, [question, router]);

  // Answer handler
  const handleAnswer = useCallback(
    (ticketId: number, selectedIndex: number, isCorrect: boolean) => {
      if (isAuthenticated) {
        recordAnswer(ticketId, isCorrect);
      }
    },
    [isAuthenticated, recordAnswer]
  );

  // Favorite handler
  const handleToggleFavorite = useCallback(
    (ticketId: number) => {
      if (isAuthenticated) {
        toggleFavorite(ticketId);
      }
    },
    [isAuthenticated, toggleFavorite]
  );

  // Exclude handler
  const handleToggleExcluded = useCallback(
    (ticketId: number) => {
      if (isAuthenticated) {
        toggleExcluded(ticketId);
      }
    },
    [isAuthenticated, toggleExcluded]
  );

  // Loading state
  if (authLoading || isLoading) {
    return <PracticeLoading />;
  }

  // Error state
  if (error) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => fetchQuestion(questionId)}
            className="text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // No question
  if (!question) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">
          No question found
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      {/* Guest warning */}
      {!isAuthenticated && <GuestWarningBanner className="mb-6" />}

      {/* Question card */}
      <QuestionCard
        question={question}
        language={preferences.preferredLanguage}
        currentIndex={question.ticket_id}
        totalQuestions={totalQuestions}
        isFavorite={isFavorite(question.ticket_id)}
        isExcluded={isExcluded(question.ticket_id)}
        isAuthenticated={isAuthenticated}
        onAnswer={handleAnswer}
        onNext={question.ticket_id < totalQuestions ? handleNext : undefined}
        onPrevious={question.ticket_id > 1 ? handlePrevious : undefined}
        onRandom={fetchRandomQuestion}
        onToggleFavorite={handleToggleFavorite}
        onToggleExcluded={handleToggleExcluded}
      />
    </div>
  );
}

// Page component with Suspense boundary
export default function PracticePage() {
  return (
    <Suspense fallback={<PracticeLoading />}>
      <PracticeContent />
    </Suspense>
  );
}