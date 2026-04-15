'use client';

import { useState, useEffect, useCallback } from 'react';
import { Question, Language } from '@/lib/types';
import { AnswerButton } from './AnswerButton';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { SimpleCheckbox } from './ui/checkbox';
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle,
  EyeOff 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  language: Language;
  currentIndex: number;
  totalQuestions: number;
  isFavorite?: boolean;
  isExcluded?: boolean;
  isAuthenticated?: boolean;
  onAnswer?: (ticketId: number, selectedIndex: number, isCorrect: boolean) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onRandom?: () => void;
  onToggleFavorite?: (ticketId: number) => void;
  onToggleExcluded?: (ticketId: number) => void;
}

export function QuestionCard({
  question,
  language,
  currentIndex,
  totalQuestions,
  isFavorite = false,
  isExcluded = false,
  isAuthenticated = false,
  onAnswer,
  onNext,
  onPrevious,
  onRandom,
  onToggleFavorite,
  onToggleExcluded,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setIsRevealed(false);
  }, [question.ticket_id]);

  // Handle answer selection
  const handleAnswerClick = useCallback((index: number) => {
    if (isRevealed) return;

    setSelectedAnswer(index);
    setIsRevealed(true);

    const isCorrect = question.answers.find((a) => a.index === index)?.is_correct ?? false;
    onAnswer?.(question.ticket_id, index, isCorrect);
  }, [isRevealed, question, onAnswer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Number keys 1-4 for answer selection
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4) {
        const answer = question.answers.find((a) => a.index === num);
        if (answer) {
          handleAnswerClick(num);
        }
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowLeft' && onPrevious) {
        onPrevious();
      }
      if (e.key === 'ArrowRight' && onNext) {
        onNext();
      }

      // R for random
      if (e.key === 'r' || e.key === 'R') {
        onRandom?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question.answers, handleAnswerClick, onNext, onPrevious, onRandom]);

  // Get explanation text
  const explanation = question.explanation?.[language];
  const hasExplanation = explanation && explanation.trim().length > 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-4 sm:p-6">
        {/* Question Image */}
        {question.img && (
          <div className="question-image-container mb-4 rounded-lg overflow-hidden bg-muted">
            <span className="ticket-number">#{question.ticket_id}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/img/${question.img}.avif`}
              alt={`Question ${question.ticket_id} illustration`}
              className="w-full h-auto max-h-64 object-contain"
              loading="lazy"
            />
          </div>
        )}

        {/* Question number (if no image) */}
        {!question.img && (
          <div className="text-sm text-muted-foreground mb-2">
            Question #{question.ticket_id}
          </div>
        )}

        {/* Question Text */}
        <h2 className="text-lg font-medium mb-6">
          {question.question[language]}
        </h2>

        {/* Answer Options */}
        <div className="space-y-3 mb-6">
          {question.answers.map((answer) => (
            <AnswerButton
              key={answer.index}
              index={answer.index}
              text={answer.text[language]}
              isCorrect={answer.is_correct}
              isRevealed={isRevealed}
              isSelected={selectedAnswer === answer.index}
              onClick={() => handleAnswerClick(answer.index)}
            />
          ))}
        </div>

        {/* Explanation (shown after answering) */}
        {isRevealed && hasExplanation && (
          <div className="p-4 bg-muted rounded-lg mb-6">
            <p className="text-sm text-muted-foreground">
              <strong>Explanation:</strong> {explanation}
            </p>
          </div>
        )}

        {/* Actions (Favorite & Exclude) */}
        {isAuthenticated && (
          <div className="flex items-center gap-4 mb-6 pb-4 border-b">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                onClick={() => onToggleFavorite?.(question.ticket_id)}
                className={cn(
                  'p-1 rounded transition-colors',
                  isFavorite ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'
                )}
              >
                <Star className={cn('w-5 h-5', isFavorite && 'fill-current')} />
              </button>
              <span className="text-sm">Favorites</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <SimpleCheckbox
                checked={isExcluded}
                onCheckedChange={() => onToggleExcluded?.(question.ticket_id)}
              />
              <span className="text-sm flex items-center gap-1">
                <EyeOff className="w-4 h-4" />
                Exclude for me
              </span>
            </label>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={!onPrevious}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Prev
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onRandom}
          >
            <Shuffle className="w-4 h-4 mr-1" />
            Random
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!onNext}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="text-center text-sm text-muted-foreground mt-4">
          Questions active: {totalQuestions}
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="hidden sm:flex justify-center gap-4 text-xs text-muted-foreground mt-2">
          <span><kbd className="kbd">1-4</kbd> Select answer</span>
          <span><kbd className="kbd">←</kbd> <kbd className="kbd">→</kbd> Navigate</span>
          <span><kbd className="kbd">R</kbd> Random</span>
        </div>
      </CardContent>
    </Card>
  );
}
