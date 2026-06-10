import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import { authAPI } from '@/services/api'

export default function VerifyEmailPage() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    authAPI.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center p-4">
      <div className="card p-10 w-full max-w-md text-center">
        {status === 'loading' && (
          <><div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"/><p className="text-gray-500">Verifying your email...</p></>
        )}
        {status === 'success' && (
          <><div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={40} className="text-emerald-500"/></div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">Email Verified!</h2>
          <p className="text-gray-500 mb-6">Your email has been verified successfully.</p>
          <Link to="/login" className="btn-primary">Sign In Now</Link></>
        )}
        {status === 'error' && (
          <><div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4"><XCircle size={40} className="text-red-500"/></div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h2>
          <p className="text-gray-500 mb-6">Link is invalid or expired.</p>
          <Link to="/login" className="btn-primary">Back to Login</Link></>
        )}
      </div>
    </div>
  )
}
