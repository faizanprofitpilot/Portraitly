import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated', authError: authError?.message })
    }

    console.log('🔍 Debug: Auth user ID:', user.id)
    console.log('🔍 Debug: Auth user email:', user.email)

    // Try to get ALL columns from users table to see what exists
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('*')
      .limit(5)
    
    console.log('📊 Debug: All users sample:', allUsers)
    console.log('📊 Debug: All users error:', allError?.message)

    // Try to find user by auth_user_id
    const { data: userByAuthId, error: authIdError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()
    
    console.log('📊 Debug: User by auth_user_id:', userByAuthId)
    console.log('📊 Debug: User by auth_user_id error:', authIdError?.message)

    // Try to find user by email
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single()
    
    console.log('📊 Debug: User by email:', userByEmail)
    console.log('📊 Debug: User by email error:', emailError?.message)

    // Try to get table structure
    let tableInfo = null
    let tableError = { message: 'RPC not available' }
    
    try {
      const result = await supabase.rpc('get_table_columns', { table_name: 'users' })
      tableInfo = result.data
      tableError = result.error || { message: 'RPC not available' }
    } catch (error) {
      tableError = { message: 'RPC not available' }
    }
    
    console.log('📊 Debug: Table structure:', tableInfo)
    console.log('📊 Debug: Table structure error:', tableError?.message)

    return NextResponse.json({
      authUser: { id: user.id, email: user.email },
      allUsersSample: allUsers,
      userByAuthId,
      userByEmail,
      tableStructure: tableInfo,
      errors: {
        allUsers: allError?.message,
        authId: authIdError?.message,
        email: emailError?.message,
        table: tableError?.message
      }
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug failed', details: error })
  }
}
