'use client';

import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface AnswerButtonProps {
  index: number;
  text: string;
  isCorrect: boolean;
  isRevealed: boolean;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function AnswerButton({
  index,
  text,
  isCorrect,
  isRevealed,
  isSelected,
  onClick,
  disabled = false,
}: AnswerButtonProps) {
  const getStateClasses = () => {
    if (!isRevealed) {
      return isSelected
        ? 'ring-2 ring-primary ring-offset-2 bg-primary/5'
        : 'hover:bg-muted';
    }

    if (isCorrect) {
      return 'bg-green-100 border-green-500 text-green-800';
    }

    if (isSelected && !isCorrect) {
      return 'bg-red-100 border-red-500 text-red-800';
    }

    return 'opacity-60';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isRevealed}
      className={cn(
        'w-full flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:cursor-not-allowed',
        getStateClasses()
      )}
    >
      {/* Number badge */}
      <span
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm shrink-0',
          isRevealed && isCorrect
            ? 'bg-green-500 text-white'
            : isRevealed && isSelected && !isCorrect
            ? 'bg-red-500 text-white'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isRevealed && isCorrect ? (
          <Check className="w-4 h-4" />
        ) : isRevealed && isSelected && !isCorrect ? (
          <X className="w-4 h-4" />
        ) : (
          index
        )}
      </span>

      {/* Answer text */}
      <span className="flex-1">{text}</span>

      {/* Keyboard hint */}
      {!isRevealed && (
        <span className="hidden sm:flex kbd opacity-50">{index}</span>
      )}
    </button>
  );
}
