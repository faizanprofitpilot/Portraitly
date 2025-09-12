'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  credits: number
  isLoading: boolean
  signIn: () => void
  signOut: () => void
  refreshCredits: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [credits, setCredits] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Initialize auth state
  useEffect(() => {
    // Listen for auth state changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await ensureUserExists(session.user)
          setIsLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setCredits(0)
          setIsLoading(false)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
          await ensureUserExists(session.user)
          setIsLoading(false)
        } else if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            setUser(session.user)
            await ensureUserExists(session.user)
          }
          setIsLoading(false)
        }
      }
    )

    // Also try to get initial session
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Session error:', error)
        }
        
        if (session?.user) {
          setUser(session.user)
          await ensureUserExists(session.user)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Auth initialization error:', error)
        setIsLoading(false)
      }
    }

    initAuth()

    return () => subscription.unsubscribe()
  }, [])

  const ensureUserExists = async (user: User) => {
    try {
      // Use the secure API route to ensure user exists
      const response = await fetch('/api/user/ensure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error:', errorData)
        setCredits(0)
        return
      }

      const data = await response.json()
      
      if (data.success && data.user) {
        console.log('User ensured:', data.user.email, 'Credits:', data.user.credits_remaining)
        setCredits(data.user.credits_remaining)
      } else {
        console.error('Unexpected response:', data)
        setCredits(0)
      }
    } catch (error) {
      console.error('Error in ensureUserExists:', error)
      setCredits(0)
    }
  }

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      console.error('Sign in error:', error)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
    }
  }

  const refreshCredits = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('credits_remaining')
        .eq('auth_user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching credits:', error)
      } else {
        setCredits(data.credits_remaining)
      }
    } catch (error) {
      console.error('Error refreshing credits:', error)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      credits,
      isLoading,
      signIn,
      signOut,
      refreshCredits
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
