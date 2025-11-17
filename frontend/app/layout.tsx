import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Resume Reviewer',
  description: 'AI-powered resume screening system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center">
                    <span className="text-2xl font-bold text-blue-600">AI Resume Reviewer</span>
                  </Link>
                  <div className="hidden md:flex gap-6">
                    <NavLink href="/">Upload</NavLink>
                    <NavLink href="/applicants">All Applicants</NavLink>
                    <NavLink href="/top-candidates">Top Candidates</NavLink>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="mt-12 py-6 text-center text-sm text-gray-900">
            <p>Powered by OpenAI GPT-4o | Built with Next.js & Vercel</p>
          </footer>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-gray-700 hover:text-blue-600 font-medium transition"
    >
      {children}
    </Link>
  );
}
