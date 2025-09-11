import Demo from '@/components/Demo'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function DemoPage() {
  return (
    <ProtectedRoute>
      <Demo />
    </ProtectedRoute>
  )
}
