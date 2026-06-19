import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '@/services/api'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authAPI.resetPassword(token, { password: data.password, confirmPassword: data.confirmPassword })
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (err) { toast.error(err.response?.data?.message || 'Reset failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-md">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Enter your new password below.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input {...register('password', {
                required: 'Password required',
                minLength: { value: 8, message: 'Min 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
                  message: 'Need uppercase, lowercase, number & special char'
                }
              })}
                type={showPass ? 'text' : 'password'} className={`input pl-9 pr-10 ${errors.password ? 'input-error' : ''}`} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input {...register('confirmPassword', { required: 'Required', validate: v => v === watch('password') || 'Passwords do not match' })}
              type="password" className={`input ${errors.confirmPassword ? 'input-error' : ''}`} />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">{loading ? 'Resetting...' : 'Reset Password'}</button>
        </form>
      </div>
    </div>
  )
}