import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle, ArrowRight, LayoutDashboard } from 'lucide-react'
import useAuthStore from '@/store/authStore'

export default function PaymentSuccess() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const sessionId = params.get('session_id')

  useEffect(() => {
    if (sessionId) {
      toast.success('Payment successful!')
    } else {
      navigate('/404')
    }
  }, [sessionId, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-10 text-center">

        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-green-600" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          Payment Successful 🎉
        </h1>

        <p className="mt-4 text-gray-500 text-lg">
          Your package has been activated successfully.
        </p>

        {/* Session Box */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4 text-left">
          <p className="text-sm text-gray-500 mb-1">
            Stripe Session ID
          </p>

          <p className="text-sm font-medium text-gray-800 break-all">
            {sessionId}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          

            <button
            onClick={() => {
                if (user?.role === 'employer') {
                navigate('/employer/packages')
                } else {
                navigate('/jobseeker/dashboard')
                }
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg transition"
            >
            View Package
            <ArrowRight size={18} />
            </button>

        </div>

      </div>
    </div>
  )
}