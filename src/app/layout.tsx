import './globals.css'

export const metadata = {
  title: 'MPA PROPERTY PROMOTERS & CONSULTANTS LTD',
  description: 'MPA Property Progress Tracker',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="el">
      <body>{children}</body>
    </html>
  )
}