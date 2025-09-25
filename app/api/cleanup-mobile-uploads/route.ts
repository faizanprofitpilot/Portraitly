import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Delete mobile uploads older than 48 hours
    const { data, error } = await supabase
      .from('mobile_uploads')
      .delete()
      .lt('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .select()

    if (error) {
      console.error('Error cleaning up mobile uploads:', error)
      return NextResponse.json(
        { error: 'Failed to cleanup mobile uploads' },
        { status: 500 }
      )
    }

    console.log(`🧹 Cleaned up ${data?.length || 0} old mobile uploads`)
    
    return NextResponse.json({ 
      message: 'Mobile uploads cleaned up successfully',
      deletedCount: data?.length || 0
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}
