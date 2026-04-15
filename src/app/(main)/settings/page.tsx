'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LanguageSelector } from '@/components/LanguageSelector';
import { SimpleCheckbox } from '@/components/ui/checkbox';
import { Language } from '@/lib/types';
import { 
  Loader2, 
  Settings, 
  Globe, 
  EyeOff,
  User,
  ArrowRight
} from 'lucide-react';

interface ExcludedQuestion {
  ticketId: number;
  questionPreview: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, preferences, updatePreferences } = useAuth();

  const [excludedQuestions, setExcludedQuestions] = useState<ExcludedQuestion[]>([]);
  const [excludedCount, setExcludedCount] = useState(0);
  const [showExcluded, setShowExcluded] = useState(false);
  const [isLoadingExcluded, setIsLoadingExcluded] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchExcludedQuestions = async () => {
    setIsLoadingExcluded(true);
    try {
      const response = await fetch(
        `/api/progress/exclusions?includeQuestions=true&lang=${preferences.preferredLanguage}`
      );
      const data = await response.json();

      if (data.success) {
        setExcludedQuestions(data.data.questions || []);
        setExcludedCount(data.data.excludedIds?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching exclusions:', err);
    } finally {
      setIsLoadingExcluded(false);
    }
  };

  const handleShowExcluded = () => {
    if (!showExcluded && excludedQuestions.length === 0) {
      fetchExcludedQuestions();
    }
    setShowExcluded(!showExcluded);
  };

  const handleRemoveExclusion = async (ticketId: number) => {
    try {
      await fetch('/api/progress/exclusions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });

      setExcludedQuestions((prev) => prev.filter((q) => q.ticketId !== ticketId));
      setExcludedCount((prev) => prev - 1);
    } catch (err) {
      console.error('Error removing exclusion:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        Settings
      </h1>

      {/* Account Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Password</div>
              <div className="text-sm text-muted-foreground">••••••••</div>
            </div>
            <Link href="/profile">
              <Button variant="outline" size="sm">
                Change Password
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Language Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Language
          </CardTitle>
          <CardDescription>
            Choose the language for questions and answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSelector
            currentLanguage={preferences.preferredLanguage}
            onLanguageChange={(lang: Language) => updatePreferences({ preferredLanguage: lang })}
          />
        </CardContent>
      </Card>

      {/* Practice Options */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Practice Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <SimpleCheckbox
              checked={preferences.prioritizeWeak}
              onCheckedChange={(checked) => updatePreferences({ prioritizeWeak: checked })}
              className="mt-0.5"
            />
            <div>
              <div className="font-medium">Prioritize weak questions</div>
              <div className="text-sm text-muted-foreground">
                Questions you&apos;ve answered incorrectly will appear more often in random mode
              </div>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Excluded Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <EyeOff className="w-5 h-5" />
            Excluded Questions
          </CardTitle>
          <CardDescription>
            Questions you&apos;ve marked as excluded won&apos;t appear in random selection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {excludedCount > 0 || excludedQuestions.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  {excludedQuestions.length || excludedCount} question{(excludedQuestions.length || excludedCount) !== 1 ? 's' : ''} excluded
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShowExcluded}
                >
                  {showExcluded ? 'Hide' : 'View & manage'}
                </Button>
              </div>

              {showExcluded && (
                <div className="space-y-2 border-t pt-4">
                  {isLoadingExcluded ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : excludedQuestions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      No excluded questions
                    </div>
                  ) : (
                    excludedQuestions.map((item) => (
                      <div
                        key={item.ticketId}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-sm font-mono text-muted-foreground shrink-0">
                            #{item.ticketId}
                          </span>
                          <span className="text-sm truncate">
                            {item.questionPreview}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExclusion(item.ticketId)}
                          className="shrink-0 ml-2"
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              No questions excluded yet. Use the &quot;Exclude for me&quot; checkbox while practicing to hide questions you don&apos;t want to see in random mode.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
