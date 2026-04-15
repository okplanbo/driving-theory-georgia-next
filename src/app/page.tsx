import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ClipboardCheck, BarChart3, Globe } from 'lucide-react';
import { BASE_QUESTION_COUNT } from '@/constants';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-14 items-center px-4 justify-self-center">
          <span className="text-xl mr-2">🚗</span>
            <span className="font-semibold text-sm sm:text-base">Georgian Driving Theory</span>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Pass Your Georgian
            <span className="text-primary"> B/B1 </span>
            Driving Exam
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Practice with all {BASE_QUESTION_COUNT} official theory questions in Georgian, English, or Russian. 
            Track your progress and ace your exam.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/practice">
              <Button size="lg" className="w-full sm:w-auto">
                <BookOpen className="mr-2 h-5 w-5" />
                Start Practice
              </Button>
            </Link>
            <Link href="/exam">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <ClipboardCheck className="mr-2 h-5 w-5" />
                Take Exam
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            Everything You Need to Pass
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{BASE_QUESTION_COUNT} Questions</CardTitle>
                <CardDescription>
                  All official theory exam questions in one place
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Practice mode with instant feedback</li>
                  <li>✓ Mark favorites for later review</li>
                  <li>✓ Exclude easy questions</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ClipboardCheck className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Exam Simulation</CardTitle>
                <CardDescription>
                  Take realistic practice exams just like the real thing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ 30 random questions</li>
                  <li>✓ 30 minute time limit</li>
                  <li>✓ Pass threshold: 90%</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Track Progress</CardTitle>
                <CardDescription>
                  See your weak areas and focus your study time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Detailed statistics</li>
                  <li>✓ Weak question prioritization</li>
                  <li>✓ Exam history</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="py-12 px-4 bg-muted/50">
        <div className="container max-w-3xl mx-auto text-center">
          <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Available in 3 Languages</h2>
          <div className="flex justify-center gap-8 text-lg">
            <span>🇬🇪 ქართული</span>
            <span>🇬🇧 English</span>
            <span>🇷🇺 Русский</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
          <p className="mb-8 opacity-90">
            Create a free account to track your progress, or start practicing right away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Create Free Account
              </Button>
            </Link>
            <Link href="/practice">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white/10">
                Practice as Guest
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t">
        <div className="text-center text-sm text-muted-foreground">
          <p>Georgian B/B1 Driving Theory Exam Preparation</p>
          <p className="mt-1">Questions sourced from official driving theory materials</p>
        </div>
      </footer>
    </div>
  );
}
