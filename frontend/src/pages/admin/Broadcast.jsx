import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Send, Bell } from 'lucide-react'
import { adminAPI } from '@/services/api'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

export default function AdminBroadcast() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const mutation = useMutation({
    mutationFn: (data) => adminAPI.sendBroadcast(data),
    onSuccess: (res) => {
      toast.success(`Broadcast sent to ${res.data?.sent || 0} users!`)
      reset()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title mb-1">Broadcast Notification</h1>
        <p className="text-gray-500 dark:text-gray-400">Send a message to all or specific users</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <Bell size={16} className="text-primary-600" />
          </div>
          <h2 className="font-display font-bold text-gray-900 dark:text-white">Compose Broadcast</h2>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Target Audience</label>
            <select {...register('targetRole')} className="input">
              <option value="all">All Users</option>
              <option value="jobseeker">Job Seekers Only</option>
              <option value="employer">Employers Only</option>
            </select>
          </div>

          <div>
            <label className="label">Notification Title *</label>
            <input {...register('title', { required: 'Title is required' })}
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g. 🎉 New Feature: AI Resume Score" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Message *</label>
            <textarea {...register('message', { required: 'Message is required' })}
              rows={4} className={`input resize-none ${errors.message ? 'input-error' : ''}`}
              placeholder="Write your broadcast message here..." />
            {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
          </div>

          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <input {...register('sendEmail')} type="checkbox" id="sendEmail"
              className="w-4 h-4 rounded text-primary-600" />
            <label htmlFor="sendEmail" className="text-sm text-amber-700 dark:text-amber-400 cursor-pointer">
              Also send as email (may take time for large audiences)
            </label>
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full justify-center">
            <Send size={15} />
            {mutation.isPending ? 'Sending...' : 'Send Broadcast'}
          </button>
        </form>
      </div>
    </div>
  )
}