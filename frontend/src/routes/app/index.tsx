import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { PageLoader } from '@/components/PageLoader'

// Type for the user object from the API
interface User {
  id: string
  email: string
  name?: string
}

// Type for the API response
interface AppDataResponse {
  success: true
  data: {
    user: User
    items: unknown[]
  }
}

export const Route = createFileRoute('/app/')({
  beforeLoad: async () => {
    // Check auth status before loading the route
    const res = await fetch('/api/auth/session')
    const session = await res.json() as { user?: { id: string } }

    if (!session?.user) {
      throw redirect({ to: '/login' })
    }
  },
  component: AppDashboard,
})

function AppDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['app', 'data'],
    queryFn: async () => {
      const res = await api.api.pages.app.data.$get()
      return res.json() as unknown as AppDataResponse
    },
  })

  if (isLoading) {
    return <PageLoader />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error loading data</h1>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  const user = data?.data.user ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
            )}
            <Link
              to="/logout"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Welcome{user?.name ? `, ${user.name}` : ''}!
          </h2>
          <p className="text-gray-600">
            You are now signed in. This is your protected dashboard.
          </p>
        </div>
      </main>
    </div>
  )
}
