import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Atlético Madrid - Sistema de Monitoreo',
  description: 'Plataforma de seguimiento neuroconductual para atletas profesionales',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gradient-to-br from-red-50 via-white to-blue-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}