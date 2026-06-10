import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { XCircle, RotateCcw, ArrowLeft } from 'lucide-react'

export default function PaymentCancel() {
  const navigate = useNavigate()

  useEffect(() => {
    toast.error('Payment cancelled or failed')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-10 text-center">

        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-14 h-14 text-red-600" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          Payment Cancelled
        </h1>

        <p className="mt-4 text-gray-500 text-lg">
          Your payment was not completed.
          <br />
          You can retry the payment anytime.
        </p>

        {/* Info Box */}
        <div className="mt-6 bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-sm text-red-600">
            No amount has been charged from your account.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">

          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>

          <button
            onClick={() => navigate('/packages')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg transition"
          >
            <RotateCcw size={18} />
            Try Again
          </button>

        </div>

      </div>
    </div>
  )
}