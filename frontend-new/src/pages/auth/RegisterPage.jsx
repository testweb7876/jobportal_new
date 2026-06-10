import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, Phone, Briefcase, Building2, ArrowRight } from 'lucide-react'
import { authAPI } from '@/services/api'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') || 'jobseeker'
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { role: defaultRole }
  })
  const selectedRole = watch('role')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await authAPI.register(data)
      const { user, accessToken, refreshToken } = res.data
      setAuth(user, accessToken, refreshToken)
      toast.success('Account created! Please check your email to verify. 📧')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-dark-900">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-primary-600 to-primary-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Briefcase size={36} className="text-white" />
          </div>
          <h2 className="font-display text-3xl font-bold mb-3">Start Your Journey</h2>
          <p className="text-primary-100 leading-relaxed">
            Join 500,000+ professionals who've found their dream career on JobPortal.
          </p>
          <div className="mt-10 space-y-4 text-left">
            {[
              { icon: '🎯', title: 'Smart Job Matching', desc: 'AI finds perfect roles for you' },
              { icon: '📊', title: 'Application Tracking', desc: 'Monitor all your applications' },
              { icon: '🔔', title: 'Instant Alerts', desc: 'Never miss a new opportunity' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/10 rounded-xl">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-primary-200 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg py-8">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Briefcase size={18} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold text-gray-900 dark:text-white">
              Job<span className="text-primary-600">Portal</span>
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">Create your account</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">It's free and takes less than 2 minutes</p>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'jobseeker', icon: User, label: 'Job Seeker', desc: 'I want to find a job' },
              { value: 'employer', icon: Building2, label: 'Employer', desc: 'I want to hire talent' },
            ].map(role => (
              <label key={role.value}
                className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all ${selectedRole === role.value ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'}`}>
                <input type="radio" {...register('role')} value={role.value} className="sr-only" />
                <role.icon size={20} className={selectedRole === role.value ? 'text-primary-600 mb-2' : 'text-gray-400 mb-2'} />
                <p className={`font-semibold text-sm ${selectedRole === role.value ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-200'}`}>{role.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{role.desc}</p>
              </label>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input {...register('firstName', { required: 'Required', minLength: { value: 2, message: 'Min 2 chars' } })}
                    placeholder="John" className={`input pl-9 ${errors.firstName ? 'input-error' : ''}`} />
                </div>
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Last Name</label>
                <input {...register('lastName', { required: 'Required', minLength: { value: 2, message: 'Min 2 chars' } })}
                  placeholder="Doe" className={`input ${errors.lastName ? 'input-error' : ''}`} />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register('email', {
                  required: 'Email required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Valid email required' }
                })}
                  type="email" placeholder="you@example.com" className={`input pl-9 ${errors.email ? 'input-error' : ''}`} />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Phone (Optional)</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register('phone')} type="tel" placeholder="+1 234 567 8900"
                  className="input pl-9" />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
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
                  type={showPass ? 'text' : 'password'} placeholder="Strong password"
                  className={`input pl-9 pr-10 ${errors.password ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <p className="text-xs text-gray-400">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link> and{' '}
              <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
            </p>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base">
              {loading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <><span>Create Account</span><ArrowRight size={16}/></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
