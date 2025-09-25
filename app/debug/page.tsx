import { createClient } from '@/lib/supabase-server'

export default async function DebugPage() {
  const supabase = createClient()
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
          
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold">Session Status:</h2>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify({
                  hasSession: !!session,
                  sessionError: sessionError?.message,
                  userId: session?.user?.id,
                  userEmail: session?.user?.email,
                  expiresAt: session?.expires_at
                }, null, 2)}
              </pre>
            </div>
            
            {session?.user && (
              <div>
                <h2 className="font-semibold">Database Check:</h2>
                {(() => {
                  // This will be executed on the server
                  const checkUser = async () => {
                    try {
                      const { data: userData, error: dbError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('auth_user_id', session.user.id)
                        .single()
                      
                      return { userData, dbError: dbError?.message }
                    } catch (error) {
                      return { userData: null, dbError: error instanceof Error ? error.message : 'Unknown error' }
                    }
                  }
                  
                  // We can't use async in JSX, so let's handle this differently
                  return (
                    <div className="text-gray-600">
                      <p>User ID: {session.user.id}</p>
                      <p>Email: {session.user.email}</p>
                      <p className="text-sm text-gray-500">Check database manually for user record</p>
                    </div>
                  )
                })()}
              </div>
            )}
            
            <div>
              <h2 className="font-semibold">Environment:</h2>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify({
                  hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                  hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                  nodeEnv: process.env.NODE_ENV
                }, null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="mt-6 space-x-4">
            <a href="/" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Go to Home
            </a>
            <a href="/dashboard" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Debug Error</h1>
          <pre className="bg-red-100 p-2 rounded text-sm overflow-auto">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </div>
      </div>
    )
  }
}
