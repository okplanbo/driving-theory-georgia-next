import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { BASE_QUESTION_COUNT } from '@/constants';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Georgian Driving Theory - B/B1 Exam Preparation',
  description: `Practice for your Georgian B/B1 driving license theory exam with ${BASE_QUESTION_COUNT} official questions in Georgian, English, and Russian.`,
  keywords: ['driving theory', 'Georgia', 'B1 license', 'exam preparation', 'მართვის მოწმობა'],
};

// TODO: Add PWA manifest and service worker registration
// export const viewport = {
//   themeColor: '#3b82f6',
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
