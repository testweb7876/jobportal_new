import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Camera, Save, Plus, Trash2, Globe, Linkedin, Github, Twitter } from 'lucide-react'
import { authAPI, uploadAPI } from '@/services/api'
import { Avatar, Input, Button } from '@/components/common/UI'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

export default function JSProfile() {
  const { user, updateUser } = useAuthStore()
  const qc = useQueryClient()
  const fileRef = useRef()
  const [avatarLoading, setAvatarLoading] = useState(false)

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      'socialLinks.linkedin': user?.socialLinks?.linkedin || '',
      'socialLinks.github': user?.socialLinks?.github || '',
      'socialLinks.twitter': user?.socialLinks?.twitter || '',
      'socialLinks.website': user?.socialLinks?.website || '',
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const api = require('@/services/api').default
      return api.patch('/users/profile', data)
    },
    onSuccess: (res) => {
      updateUser(res.data.user)
      toast.success('Profile updated!')
      qc.invalidateQueries(['me'])
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const onSubmit = (data) => {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      socialLinks: {
        linkedin: data['socialLinks.linkedin'],
        github: data['socialLinks.github'],
        twitter: data['socialLinks.twitter'],
        website: data['socialLinks.website'],
      }
    }
    updateMutation.mutate(payload)
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const api = (await import('@/services/api')).default
      const res = await api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      updateUser({ avatar: res.data.avatar })
      toast.success('Avatar updated!')
    } catch { toast.error('Failed to upload avatar') }
    finally { setAvatarLoading(false) }
  }

  const completionTasks = [
    { label: 'Add profile photo', done: !!user?.avatar?.secureUrl },
    { label: 'Fill in basic info', done: !!(user?.firstName && user?.lastName && user?.phone) },
    { label: 'Add social links', done: !!(user?.socialLinks?.linkedin || user?.socialLinks?.website) },
    { label: 'Upload resume', done: false },
    { label: 'Set job preferences', done: false },
  ]
  const completionPct = Math.round((completionTasks.filter(t => t.done).length / completionTasks.length) * 100)

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="page-title mb-1">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your personal information</p>
      </div>

      {/* Profile Completion */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Profile Completion</h3>
          <span className="text-sm font-bold text-primary-600">{completionPct}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2 mb-4">
          <div className="bg-primary-600 h-2 rounded-full transition-all duration-700"
            style={{ width: `${completionPct}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {completionTasks.map((task, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${task.done ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-dark-600'}`}>
                {task.done && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
              </div>
              <span className={task.done ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}>{task.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Avatar */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-gray-900 dark:text-white mb-5">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar src={user?.avatar?.secureUrl} name={`${user?.firstName} ${user?.lastName}`} size="xl" />
            <button onClick={() => fileRef.current?.click()}
              disabled={avatarLoading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors">
              {avatarLoading
                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={14} className="text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Upload profile photo</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG or WebP. Max 5MB. Square photos work best.</p>
            <button onClick={() => fileRef.current?.click()} className="btn-outline btn-sm mt-3">
              Choose Photo
            </button>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-6 space-y-5">
          <h2 className="font-display font-bold text-gray-900 dark:text-white">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input {...register('firstName', { required: 'Required' })}
                className={`input ${errors.firstName ? 'input-error' : ''}`} />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="label">Last Name</label>
              <input {...register('lastName', { required: 'Required' })}
                className={`input ${errors.lastName ? 'input-error' : ''}`} />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input {...register('phone')} type="tel" placeholder="+1 234 567 8900" className="input" />
          </div>

          <div className="border-t border-gray-100 dark:border-dark-700 pt-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
            <div className="space-y-3">
              {[
                { name: 'socialLinks.linkedin', icon: Linkedin, placeholder: 'https://linkedin.com/in/yourprofile', label: 'LinkedIn' },
                { name: 'socialLinks.github', icon: Github, placeholder: 'https://github.com/yourusername', label: 'GitHub' },
                { name: 'socialLinks.twitter', icon: Twitter, placeholder: 'https://twitter.com/yourhandle', label: 'Twitter' },
                { name: 'socialLinks.website', icon: Globe, placeholder: 'https://yourwebsite.com', label: 'Website' },
              ].map(({ name, icon: Icon, placeholder, label }) => (
                <div key={name} className="relative">
                  <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input {...register(name)} type="url" placeholder={placeholder} className="input pl-10" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={updateMutation.isPending || !isDirty} className="btn-primary">
              {updateMutation.isPending ? 'Saving...' : <><Save size={15} /> Save Changes</>}
            </button>
          </div>
        </div>
      </form>

      {/* Email (read-only) */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">Account</h2>
        <div>
          <label className="label">Email Address</label>
          <input value={user?.email || ''} readOnly className="input bg-gray-50 dark:bg-dark-800 cursor-not-allowed" />
          <p className="mt-1.5 text-xs text-gray-400">Email cannot be changed. Contact support if needed.</p>
        </div>
      </div>
    </div>
  )
}
