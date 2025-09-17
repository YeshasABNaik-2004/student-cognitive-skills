import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Cognitive Skills & Student Performance Dashboard',
  description: 'Student performance and cognitive skills analytics',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <div className="min-h-screen">
          <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-gray-100">
            <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold tracking-tight bg-brand-50 text-brand-800 px-3 py-1 rounded-md">Cognitive Skills & Student Performance Dashboard</h1>
              <a href="https://vercel.com" className="text-sm text-gray-500 hover:text-gray-700">Deploy</a>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-6 py-8">
            {children}
          </main>
          <footer className="mx-auto max-w-7xl px-6 py-8 text-sm text-gray-500">Built with Next.js, Tailwind, Recharts</footer>
        </div>
      </body>
    </html>
  )
}


