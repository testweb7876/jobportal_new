import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import api, { authAPI } from '@/services/api'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [failed, setFailed] = useState(false)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    // Tokens arrive in the URL fragment (#...), not the query string (?...),
    // so they never get sent to the server or logged anywhere along the way.
    const hash = window.location.hash.replace(/^#/, '')
    const params = new URLSearchParams(hash)
    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')

    if (!accessToken || !refreshToken) {
      setFailed(true)
      return
    }

    // Temporarily set the header so getMe() can authenticate before the
    // store is fully populated.
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

    authAPI.getMe()
      .then((res) => {
        setAuth(res.data.user, accessToken, refreshToken)
        toast.success(`Welcome, ${res.data.user.firstName}! 👋`)
        navigate('/dashboard', { replace: true })
      })
      .catch(() => setFailed(true))
  }, [navigate, setAuth])

  if (failed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center p-4">
        <div className="card p-10 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">Sign-in Failed</h2>
          <p className="text-gray-500 mb-6">Something went wrong completing your sign-in. Please try again.</p>
          <button onClick={() => navigate('/login')} className="btn-primary">Back to Login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Signing you in...</p>
      </div>
    </div>
  )
}