import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pre-Launch Token Access',
  description: 'Privacy-first launchpad for pre-launch token distribution',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
