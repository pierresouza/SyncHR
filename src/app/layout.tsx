import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SyncHR - Smart Leading',
  description: 'Sistema Inteligente de Mediação de Conflitos e Copiloto de Feedbacks 1:1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {/* Ambient background decoration */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="orb absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full -top-[100px] -right-[100px]" />
          <div className="orb absolute w-[400px] h-[400px] bg-cyan-600/10 rounded-full bottom-[100px] -left-[100px] [animation-delay:-5s]" />
        </div>
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
