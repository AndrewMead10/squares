import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { PageLoader } from '@/components/PageLoader'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // The backend handles the OAuth callback and sets the session cookie.
    // We just need to redirect to the app after a brief moment.
    const timer = setTimeout(() => {
      navigate({ to: '/app' })
    }, 500)

    return () => clearTimeout(timer)
  }, [navigate])

  return <PageLoader />
}
