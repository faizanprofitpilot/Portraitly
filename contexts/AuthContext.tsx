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
    const initAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Auth error:', error)
          setIsLoading(false)
          return
        }
        
        if (user) {
          setUser(user)
          await ensureUserExists(user)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Auth initialization error:', error)
        setIsLoading(false)
      }
    }

    initAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await ensureUserExists(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setCredits(0)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const ensureUserExists = async (user: User) => {
    try {
      // Check if user exists in database
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('credits_remaining')
        .eq('auth_user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" - that's expected for new users
        console.error('Error checking user:', fetchError)
        setCredits(0)
        return
      }

      if (existingUser) {
        // User exists, set their credits
        setCredits(existingUser.credits_remaining)
      } else {
        // User doesn't exist, create them
        console.log('Creating new user:', user.email)
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            auth_user_id: user.id,
            email: user.email!,
            plan: 'free',
            credits_remaining: 10
          })

        if (insertError) {
          console.error('Error creating user:', insertError)
          setCredits(0)
        } else {
          console.log('User created successfully')
          setCredits(10)
        }
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
