'use client'

import { SessionProvider } from 'next-auth/react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // 5 dakikada bir yenile
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
} 