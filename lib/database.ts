import { createClient } from './supabase/server'

export interface User {
  id: string
  email: string
  credits_remaining: number
  created_at: string
}

export interface Photo {
  id: string
  user_id: string
  original_url: string
  generated_url: string | null
  created_at: string
}

export async function getUser(userId: string): Promise<User | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return data
}

export async function createUser(userId: string, email: string): Promise<User | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      credits_remaining: 10 // Free trial credits
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user:', error)
    return null
  }

  return data
}

export async function decrementCredits(userId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.rpc('decrement_credits', {
    user_id: userId
  })

  if (error) {
    console.error('Error decrementing credits:', error)
    return false
  }

  return true
}

export async function createPhoto(
  userId: string,
  originalUrl: string,
  generatedUrl?: string
): Promise<Photo | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('photos')
    .insert({
      user_id: userId,
      original_url: originalUrl,
      generated_url: generatedUrl || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating photo:', error)
    return null
  }

  return data
}

export async function getUserPhotos(userId: string): Promise<Photo[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching photos:', error)
    return []
  }

  return data || []
}
