import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { PageLoader } from '@/components/PageLoader'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  // Call onLoad endpoint
  const { data, isLoading } = useQuery({
    queryKey: ['pages', 'index', 'data'],
    queryFn: async () => {
      const res = await api.api.pages.index.data.$get()
      return res.json()
    },
  })

  if (isLoading) {
    return <PageLoader />
  }

  const pageData = data?.success ? data.data : { title: 'Cloudflare App', description: '' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {pageData.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {pageData.description || 'A full-stack web application template with type-safe RPC, authentication, and modern tooling.'}
          </p>
        </header>

        <div className="flex justify-center gap-4 mb-16">
          <Link
            to="/login"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            View on GitHub
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Type-Safe RPC</h3>
            <p className="text-gray-600">
              End-to-end type safety with Hono RPC client and TypeScript.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication</h3>
            <p className="text-gray-600">
              Built-in Google OAuth with Better Auth and secure sessions.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Edge Deployment</h3>
            <p className="text-gray-600">
              Deploy globally on Cloudflare Workers with D1 or PlanetScale.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
