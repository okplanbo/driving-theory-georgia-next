'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { LocalizedText, ExamAnswer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RotateCcw, 
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface ExamResults {
  correctCount: number;
  totalCount: number;
  passingScore: number;
  passed: boolean;
  durationSeconds: number;
  wrongAnswerIds?: number[];
  answers: ExamAnswer[];
  questions: Array<{
    ticketId: number;
    question: LocalizedText;
  }>;
}

export default function ResultsPage() {
  const router = useRouter();
  const { preferences } = useAuth();
  const [results, setResults] = useState<ExamResults | null>(null);

  useEffect(() => {
    const storedResults = sessionStorage.getItem('examResults');
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    } else {
      router.push('/exam');
    }
  }, [router]);

  if (!results) {
    return null;
  }

  const { correctCount, totalCount, passed, durationSeconds, answers, questions } = results;
  const percentage = Math.round((correctCount / totalCount) * 100);
  const language = preferences.preferredLanguage;

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Get wrong answers with question text
  const wrongAnswers = answers
    .filter((a) => !a.isCorrect)
    .map((a) => {
      const question = questions.find((q) => q.ticketId === a.ticketId);
      return {
        ticketId: a.ticketId,
        questionPreview: question?.question[language]?.substring(0, 60) + '...' || `Question #${a.ticketId}`,
      };
    });

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      {/* Result Card */}
      <Card className={cn(
        'mb-6 border-2',
        passed ? 'border-green-500' : 'border-red-500'
      )}>
        <CardHeader className="text-center pb-2">
          {passed ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-2" />
          )}
          <CardTitle className={cn(
            'text-3xl',
            passed ? 'text-green-600' : 'text-red-600'
          )}>
            {passed ? 'PASSED!' : 'NOT PASSED'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center mb-6">
            <div>
              <div className="text-3xl font-bold">{correctCount}/{totalCount}</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{percentage}%</div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            <div>
              <div className="text-3xl font-bold flex items-center justify-center gap-1">
                <Clock className="w-5 h-5" />
                {formatDuration(durationSeconds)}
              </div>
              <div className="text-sm text-muted-foreground">Time</div>
            </div>
          </div>

          <div className="text-center text-muted-foreground mb-6">
            {passed 
              ? "Congratulations! You're ready for the real exam."
              : `You need ${Math.ceil(totalCount * 0.9)} correct answers (90%) to pass. Keep practicing!`
            }
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => {
                sessionStorage.removeItem('examResults');
                router.push('/exam');
              }}
              className="flex-1"
              variant={passed ? 'outline' : 'default'}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Link href="/practice" className="flex-1">
              <Button className="w-full" variant={passed ? 'default' : 'outline'}>
                <BookOpen className="w-4 h-4 mr-2" />
                Back to Practice
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Wrong answers review */}
      {wrongAnswers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Wrong Answers ({wrongAnswers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {wrongAnswers.map((item) => (
                <Link
                  key={item.ticketId}
                  href={`/practice?id=${item.ticketId}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">
                      #{item.ticketId}
                    </span>
                    <span className="text-sm">
                      {item.questionPreview}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
