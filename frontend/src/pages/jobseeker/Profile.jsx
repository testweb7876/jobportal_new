import { useState, useRef } from 'react'
import { categoriesAPI } from '@/services/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Camera, Save, Globe, Linkedin, Github, Twitter, FileText, Plus, X } from 'lucide-react'
import api from '@/services/api'
import SkillsCard from '@/components/profile/SkillsCard'
import { Avatar } from '@/components/common/UI'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

export default function JSProfile() {
  const { user, updateUser } = useAuthStore()
  const qc = useQueryClient()
  const fileRef = useRef()
  const [avatarLoading, setAvatarLoading] = useState(false)

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      firstName:    user?.firstName || '',
      lastName:     user?.lastName  || '',
      phone:        user?.phone     || '',
      gender:       user?.gender    || '',
      dateOfBirth:  user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      nationality:  user?.nationality || '',
      currentCity:  user?.currentCity || '',
      address:      user?.address    || '',
      headline:     user?.headline   || '',
      bio:          user?.bio        || '',
      totalExperience: user?.totalExperience || '',
      expectedSalary:  user?.expectedSalary  || '',
      noticePeriod:    user?.noticePeriod    || '',
      'socialLinks.linkedin': user?.socialLinks?.linkedin || '',
      'socialLinks.github':   user?.socialLinks?.github   || '',
      'socialLinks.twitter':  user?.socialLinks?.twitter  || '',
      'socialLinks.website':  user?.socialLinks?.website  || '',
    }
  })

  // ── Profile update ────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (payload) => api.patch('/users/profile', payload),
    onSuccess: (res) => {
      const updatedUser = res.data?.data?.user || res.data?.user
      updateUser(updatedUser)   
      toast.success('Profile updated!')
      qc.invalidateQueries(['me'])
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update profile')
    },
  })

  const onSubmit = (data) => {
    const payload = {
        firstName: data.firstName,
        lastName:  data.lastName,
        phone:     data.phone,
        gender:    data.gender,
        dateOfBirth: data.dateOfBirth || undefined,
        nationality: data.nationality,
        currentCity: data.currentCity,
        address:     data.address,
        headline:    data.headline,
        bio:         data.bio,
        totalExperience: data.totalExperience,
        expectedSalary:  data.expectedSalary,
        noticePeriod:    data.noticePeriod,

      socialLinks: {
        linkedin: data.socialLinks?.linkedin || '',
        github: data.socialLinks?.github || '',
        twitter: data.socialLinks?.twitter || '',
        website: data.socialLinks?.website || '',
      },
    }

    console.log(payload)

    updateMutation.mutate(payload)
  }

  // categoriesData and jobTypesData are used in the Job Preferences section, which is not included in this snippet but is part of the full Profile page.
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getCategories().then(r => r.data?.data?.categories || r.data?.categories || r.data?.data || []),
  })
  const { data: jobTypesData } = useQuery({
    queryKey: ['jobTypes'],
    queryFn: () => categoriesAPI.getJobTypes().then(r => r.data?.data?.jobTypes || r.data?.jobTypes || r.data?.data || []),
  })

  // Add this mutation:
  const prefMutation = useMutation({
    mutationFn: (payload) => api.patch('/users/profile', { jobPreferences: payload }),
    onSuccess: (res) => {
      const updatedUser = res.data?.data?.user || res.data?.user
      updateUser(updatedUser)
      toast.success('Job preferences saved!')
      qc.invalidateQueries(['me'])
    },
    onError: () => toast.error('Failed to save preferences'),
  })

  // Add local state for preferences:
  const [selectedCategories, setSelectedCategories] = useState(user?.jobPreferences?.categories || [])
  const [selectedJobTypes, setSelectedJobTypes]     = useState(user?.jobPreferences?.jobTypes || [])
  const [workplaceType, setWorkplaceType]           = useState(user?.jobPreferences?.workplaceType || '')

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateUser({ avatar: res.data.data?.avatar || res.data.avatar, profileCompleted: res.data.data?.profileCompleted || res.data.profileCompleted })
      toast.success('Avatar updated!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload avatar')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const res = await api.post('/users/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      updateUser({ ...user, resume: res.data.resume, profileCompleted: res.data.profileCompleted })

      toast.success('Resume uploaded!')
    } catch (err) {
      toast.error('Upload failed')
    }
  }

  // ── Profile completion ────────────────────────────────────────────────────
  const completionTasks = [
    { label: 'Add profile photo',  done: !!user?.avatar?.secureUrl },
    { label: 'Fill in basic info', done: !!(user?.firstName && user?.lastName && user?.phone) },
    { label: 'Add social links',   done: !!(user?.socialLinks?.linkedin || user?.socialLinks?.website) },
    { label: 'Upload a resume',    done: !!user?.resume?.secureUrl,},
    { label: 'Set job preferences', done: !!user?.jobPreferences?.categories?.length || !!user?.jobPreferences?.jobTypes?.length, },
  ]
  const completionPct = Math.round(
    (completionTasks.filter(t => t.done).length / completionTasks.length) * 100
  )

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="page-title mb-1">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your personal information</p>
      </div>

      {/* ── Profile Completion ────────────────────────────────────────────── */}
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
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                ${task.done ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-dark-600'}`}>
                {task.done && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </div>
              <span className={task.done
                ? 'text-gray-400 dark:text-gray-500 line-through'
                : 'text-gray-700 dark:text-gray-200'}>
                {task.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Avatar ───────────────────────────────────────────────────────── */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-gray-900 dark:text-white mb-5">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar
              src={user?.avatar?.secureUrl}
              name={`${user?.firstName} ${user?.lastName}`}
              size="xl"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={avatarLoading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors">
              {avatarLoading
                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={14} className="text-white" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Upload profile photo</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              JPG, PNG or WebP. Max 5MB. Square photos work best.
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-outline btn-sm mt-3">
              Choose Photo
            </button>
          </div>
        </div>
      </div>

      {/* ── Personal Info Form ─────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-6 space-y-5">
          <h2 className="font-display font-bold text-gray-900 dark:text-white">Personal Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                className={`input ${errors.firstName ? 'input-error' : ''}`}
                placeholder="John"
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                className={`input ${errors.lastName ? 'input-error' : ''}`}
                placeholder="Doe"
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="+1 234 567 8900"
              className="input"
            />
          </div>

          {/* Social Links */}
          <div className="border-t border-gray-100 dark:border-dark-700 pt-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
            <div className="space-y-3">
              {[
                { name: 'socialLinks.linkedin', Icon: Linkedin, placeholder: 'https://linkedin.com/in/yourprofile' },
                { name: 'socialLinks.github',   Icon: Github,   placeholder: 'https://github.com/yourusername' },
                { name: 'socialLinks.twitter',  Icon: Twitter,  placeholder: 'https://twitter.com/yourhandle' },
                { name: 'socialLinks.website',  Icon: Globe,    placeholder: 'https://yourwebsite.com' },
              ].map(({ name, Icon, placeholder }) => (
                <div key={name} className="relative">
                  <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    {...register(name)}
                    type="url"
                    placeholder={placeholder}
                    className="input pl-10"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updateMutation.isPending || !isDirty}
              className="btn-primary">
              {updateMutation.isPending
                ? 'Saving...'
                : <><Save size={15} /> Save Changes</>}
            </button>
          </div>
        </div>
      </form>

      {/* ── Resume Upload ───────────────────────────────────────────────────── */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">Resume</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            {user?.resume?.secureUrl ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                  <FileText size={16} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.resume.filename || 'Resume uploaded'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.resume.uploadedAt
                      ? new Date(user.resume.uploadedAt).toLocaleDateString()
                      : ''}
                  </p>
                </div>
                <a
                  href={user.resume.secureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline btn-sm">
                  View
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No resume uploaded yet. Upload a PDF or Word document.
              </p>
            )}
          </div>
          <div>
            <label className="btn-primary cursor-pointer">
              {avatarLoading ? 'Uploading...' : user?.resume?.secureUrl ? 'Replace' : 'Upload Resume'}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleResumeUpload}
              />
            </label>
          </div>
        </div>
      </div>

      {/* ── Job Preferences ─────────────────────────────────────────────────── */}
      <div className="card p-6 space-y-5">
        <h2 className="font-display font-bold text-gray-900 dark:text-white">Job Preferences</h2>

        {/* Categories */}
        <div>
          <label className="label">Preferred Job Categories</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {(categoriesData || []).map(cat => {
              const selected = selectedCategories.includes(cat._id)
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setSelectedCategories(prev =>
                    selected ? prev.filter(id => id !== cat._id) : [...prev, cat._id]
                  )}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${selected
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-dark-600 hover:border-primary-400'
                    }`}>
                  {cat.catTitle}
                </button>
              )
            })}
          </div>
        </div>

        {/* Job Types */}
        <div>
          <label className="label">Job Types</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {(jobTypesData || []).map(jt => {
              const selected = selectedJobTypes.includes(jt._id)
              return (
                <button
                  key={jt._id}
                  type="button"
                  onClick={() => setSelectedJobTypes(prev =>
                    selected ? prev.filter(id => id !== jt._id) : [...prev, jt._id]
                  )}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${selected
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-dark-600 hover:border-primary-400'
                    }`}>
                  {jt.title}
                </button>
              )
            })}
          </div>
        </div>

        {/* Workplace Type */}
        <div>
          <label className="label">Preferred Workplace</label>
          <div className="flex gap-3 mt-2">
            {['onsite', 'remote', 'hybrid'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setWorkplaceType(type)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border capitalize transition-colors
                  ${workplaceType === type
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-dark-600'
                  }`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={prefMutation.isPending}
            onClick={() => prefMutation.mutate({
              categories: selectedCategories,
              jobTypes: selectedJobTypes,
              workplaceType,
            })}
            className="btn-primary">
            {prefMutation.isPending ? 'Saving...' : <><Save size={15} /> Save Preferences</>}
          </button>
        </div>
      </div>

      {/* Gender, DOB, Nationality — Personal Info card ke andar */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Gender</label>
          <select {...register('gender')} className="input">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Date of Birth</label>
          <input {...register('dateOfBirth')} type="date" className="input" />
        </div>
        <div>
          <label className="label">Nationality</label>
          <input {...register('nationality')} placeholder="e.g. Indian" className="input" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Current City</label>
          <input {...register('currentCity')} placeholder="e.g. Mumbai" className="input" />
        </div>
        <div>
          <label className="label">Address</label>
          <input {...register('address')} placeholder="Street address" className="input" />
        </div>
      </div>

      {/* ── Professional Info ──────────────────────────────────── */}
      <div className="border-t border-gray-100 dark:border-dark-700 pt-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Professional Details</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Professional Headline</label>
            <input {...register('headline')} placeholder="e.g. Senior React Developer with 5+ years" className="input" />
          </div>
          <div>
            <label className="label">Bio / About Me</label>
            <textarea {...register('bio')} rows={4} placeholder="Tell employers about yourself..." className="input resize-none" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Total Experience</label>
              <select {...register('totalExperience')} className="input">
                <option value="">Select</option>
                {['Fresher', '1 year', '2 years', '3 years', '4 years', '5 years', '6-8 years', '9-12 years', '12+ years'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Expected Salary</label>
              <input {...register('expectedSalary')} placeholder="e.g. 8 LPA" className="input" />
            </div>
            <div>
              <label className="label">Notice Period</label>
              <select {...register('noticePeriod')} className="input">
                <option value="">Select</option>
                {['Immediate', '15 days', '30 days', '60 days', '90 days'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Skills ─────────────────────────────────────────────────── */}
      <SkillsCard user={user} updateUser={updateUser} qc={qc} />

      {/* ── Email (read-only) ──────────────────────────────────────────── */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">Account</h2>
        <div>
          <label className="label">Email Address</label>
          <input
            value={user?.email || ''}
            readOnly
            className="input bg-gray-50 dark:bg-dark-800 cursor-not-allowed"
          />
          <p className="mt-1.5 text-xs text-gray-400">
            Email cannot be changed. Contact support if needed.
          </p>
        </div>
      </div>
    </div>
  )
}
