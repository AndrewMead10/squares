import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { PageLoader } from '@/components/PageLoader'

export const Route = createFileRoute('/logout')({
  component: LogoutPage,
})

function LogoutPage() {
  const navigate = useNavigate()

  // Call onLoad endpoint
  const { data, isLoading } = useQuery({
    queryKey: ['pages', 'logout', 'data'],
    queryFn: async () => {
      const res = await api.api.pages.logout.data.$get()
      return res.json()
    },
  })

  // Call onSubmit action
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await api.api.pages.logout.logout.$post()
      return res.json()
    },
    onSuccess: async (data) => {
      if (data.success && data.data.redirectUrl) {
        // Call the BetterAuth signout endpoint
        await fetch(data.data.redirectUrl, { method: 'POST' })
      }
      navigate({ to: '/' })
    },
  })

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  const handleCancel = () => {
    navigate({ to: '/app' })
  }

  if (isLoading) {
    return <PageLoader />
  }

  const pageData = data?.success ? data.data : { message: 'Are you sure you want to log out?' }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign out</h1>
          <p className="text-gray-600 mb-8">{pageData.message}</p>

          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
