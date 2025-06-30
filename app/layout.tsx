import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BuildTrack - Project Management by Dezprox',
  description: 'BuildTrack is a powerful project management solution developed by Dezprox, designed to streamline your construction and development projects. Track progress, manage tasks, and collaborate efficiently with your team. Brought to you by Dezprox - Innovating digital solutions for the modern world.',
  icons: {
    icon: '/dezproxlogo.png',
  },
  keywords: ['project management', 'construction', 'Dezprox', 'task tracking', 'team collaboration', 'build track'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
