import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Thai } from 'next/font/google'
import './globals.css'

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-sans-thai',
})

export const metadata: Metadata = {
  title: 'itpctakecare — ระบบดูแลนักเรียนรายเคส',
  description: 'ระบบบันทึกและติดตามการดูแลนักเรียนรายเคสสำหรับครูที่ปรึกษา โรงเรียน ITPC',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#9f77b4',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <body>{children}</body>
    </html>
  )
}
