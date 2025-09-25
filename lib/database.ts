import { createClient } from './supabase/server'

export interface User {
  id: string
  auth_user_id: string
  email: string
  plan: string
  credits_remaining: number
  stripe_customer_id?: string
  subscription_status?: string
  subscription_plan?: string
  subscription_id?: string
  last_payment_date?: string
  created_at: string
  updated_at: string
}

export interface Photo {
  id: string
  user_id: string
  original_url: string
  generated_url: string | null
  created_at: string
}

export async function getUser(authUserId: string): Promise<User | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return data
}

export async function createUser(authUserId: string, email: string): Promise<User | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .insert({
      auth_user_id: authUserId,
      email,
      plan: 'free',
      credits_remaining: 10, // Free trial credits
      subscription_status: 'free'
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
