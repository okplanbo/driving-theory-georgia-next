'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Question, ExamAnswer, ApiResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  Clock, 
  AlertTriangle, 
  ChevronRight,
  CheckCircle,
  XCircle 
} from 'lucide-react';

const EXAM_TIME_LIMIT = 30 * 60; // 30 minutes in seconds

export default function ExamPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, preferences } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(EXAM_TIME_LIMIT);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTimeRef = useRef<number>(0);

  // Fetch exam questions
  const startExam = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/questions/exam-set');
      const data: ApiResponse<{ questions: Question[] }> = await response.json();

      if (data.success) {
        setQuestions(data.data!.questions);
        setExamStarted(true);
        setTimeRemaining(EXAM_TIME_LIMIT);
        startTimeRef.current = Date.now();
      } else {
        setError(data.error || 'Failed to load exam questions');
      }
    } catch (err) {
      console.error('Error starting exam:', err);
      setError('Failed to start exam. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Timer
  useEffect(() => {
    if (!examStarted || examFinished) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit
          clearInterval(interval);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examStarted, examFinished]);

  // Submit exam
  const submitExam = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setExamFinished(true);

    const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

    if (isAuthenticated) {
      try {
        const response = await fetch('/api/exam/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers, durationSeconds }),
        });

        const data: ApiResponse<{ correctCount: number; totalCount: number }> = await response.json();
        
        if (data.success) {
          // Store results in sessionStorage for results page
          sessionStorage.setItem('examResults', JSON.stringify({
            ...data.data,
            answers,
            questions: questions.map((q) => ({
              ticketId: q.ticket_id,
              question: q.question,
            })),
          }));
          router.push('/results');
        }
      } catch (err) {
        console.error('Error submitting exam:', err);
      }
    } else {
      // For guests, calculate locally
      const correctCount = answers.filter((a) => a.isCorrect).length;
      sessionStorage.setItem('examResults', JSON.stringify({
        correctCount,
        totalCount: answers.length,
        passingScore: Math.ceil(answers.length * 0.9),
        passed: correctCount >= Math.ceil(answers.length * 0.9),
        durationSeconds,
        answers,
        questions: questions.map((q) => ({
          ticketId: q.ticket_id,
          question: q.question,
        })),
      }));
      router.push('/results');
    }
  }, [answers, questions, isAuthenticated, router, isSubmitting]);

  // Handle answer selection
  const handleSelectAnswer = (index: number) => {
    setSelectedAnswer(index);
  };

  // Confirm answer and move to next question
  const handleConfirmAnswer = () => {
    if (selectedAnswer === null) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = currentQuestion.answers.find(
      (a) => a.index === selectedAnswer
    )?.is_correct ?? false;

    const newAnswer: ExamAnswer = {
      ticketId: currentQuestion.ticket_id,
      selectedIndex: selectedAnswer,
      isCorrect,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last question - submit exam
      // Need to pass the updated answers directly since state hasn't updated yet
      submitExamWithAnswers(newAnswers);
    }
  };

  const submitExamWithAnswers = async (finalAnswers: ExamAnswer[]) => {
    setIsSubmitting(true);
    setExamFinished(true);

    const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

    if (isAuthenticated) {
      try {
        const response = await fetch('/api/exam/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: finalAnswers, durationSeconds }),
        });

        const data: ApiResponse<{ correctCount: number; totalCount: number }> = await response.json();
        
        if (data.success) {
          sessionStorage.setItem('examResults', JSON.stringify({
            ...data.data,
            answers: finalAnswers,
            questions: questions.map((q) => ({
              ticketId: q.ticket_id,
              question: q.question,
            })),
          }));
          router.push('/results');
        }
      } catch (err) {
        console.error('Error submitting exam:', err);
      }
    } else {
      const correctCount = finalAnswers.filter((a) => a.isCorrect).length;
      sessionStorage.setItem('examResults', JSON.stringify({
        correctCount,
        totalCount: finalAnswers.length,
        passingScore: Math.ceil(finalAnswers.length * 0.9),
        passed: correctCount >= Math.ceil(finalAnswers.length * 0.9),
        durationSeconds,
        answers: finalAnswers,
        questions: questions.map((q) => ({
          ticketId: q.ticket_id,
          question: q.question,
        })),
      }));
      router.push('/results');
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={startExam} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  // Start screen
  if (!examStarted) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Exam Simulation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-muted-foreground">
              <p className="mb-4">Test your knowledge with a realistic exam simulation.</p>
              <div className="grid grid-cols-3 gap-4 my-6">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">30</div>
                  <div className="text-sm">Questions</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">30</div>
                  <div className="text-sm">Minutes</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">90%</div>
                  <div className="text-sm">To Pass</div>
                </div>
              </div>
              <p className="text-sm">
                Once started, you cannot go back to previous questions.
              </p>
            </div>

            {!isAuthenticated && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Sign in to save your exam results and track your progress.
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={startExam} size="lg" className="w-full">
              Start Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Current question
  const currentQuestion = questions[currentIndex];
  const language = preferences.preferredLanguage;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      {/* Header with timer */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-medium">
          Question {currentIndex + 1} of {questions.length}
        </div>
        <div className={cn(
          'flex items-center gap-2 font-mono text-lg',
          timeRemaining < 300 ? 'text-destructive' : ''
        )}>
          <Clock className="w-5 h-5" />
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {questions.map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full',
              i < currentIndex
                ? answers[i]?.isCorrect
                  ? 'bg-green-500'
                  : 'bg-red-500'
                : i === currentIndex
                ? 'bg-primary'
                : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Question Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          {/* Image */}
          {currentQuestion.img && (
            <div className="mb-4 rounded-lg overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/img/${currentQuestion.img}.avif`}
                alt={`Question ${currentQuestion.ticket_id}`}
                className="w-full h-auto max-h-64 object-contain"
              />
            </div>
          )}

          {/* Question text */}
          <h2 className="text-lg font-medium mb-6">
            {currentQuestion.question[language]}
          </h2>

          {/* Answer options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.answers.map((answer) => (
              <button
                key={answer.index}
                onClick={() => handleSelectAnswer(answer.index)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all',
                  selectedAnswer === answer.index
                    ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
                    : 'border-border hover:bg-muted'
                )}
              >
                <span className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm shrink-0',
                  selectedAnswer === answer.index
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}>
                  {answer.index}
                </span>
                <span className="flex-1">{answer.text[language]}</span>
              </button>
            ))}
          </div>

          {/* Confirm button */}
          <Button
            onClick={handleConfirmAnswer}
            disabled={selectedAnswer === null || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : currentIndex === questions.length - 1 ? (
              'Finish Exam'
            ) : (
              <>
                Confirm & Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
