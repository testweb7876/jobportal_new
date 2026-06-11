import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Save, ArrowLeft, Eye, AlertCircle, Plus, X } from 'lucide-react'
import { jobsAPI, categoriesAPI, packageAPI } from '@/services/api'
import { Input, Select, Textarea, Button, Badge } from '@/components/common/UI'
import toast from 'react-hot-toast'

const WORKPLACE_TYPES = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

const EXPERIENCE_OPTIONS = [0, 1, 2, 3, 4, 5, 7, 10].map(y => ({
  value: y, label: y === 0 ? 'No experience required' : `${y}+ years`
}))

export default function EmpPostJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [description, setDescription] = useState('')
  const [qualifications, setQualifications] = useState('')

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      workplaceType: 'onsite',
      experience: 0,
      noOfJobs: 1,
      hideSalaryRange: true,
      isUrgent: false,
      jobApplyLink: false,
      careerLevel: '',
      educationId: '',
      showContact: false,
      currency: 'USD',
    }
  })

  const hideSalary = watch('hideSalaryRange')
  const jobApplyLink = watch('jobApplyLink')

  // Load existing job data
  const { data: jobData } = useQuery({
    queryKey: ['job-edit', id],
    queryFn: () => jobsAPI.getOne(id).then(r => r.data?.job),
    enabled: isEdit,
  })

  useEffect(() => {
    if (jobData) {
      reset({
        title: jobData.title,
        categoryId: jobData.categoryId?._id || jobData.categoryId,
        subcategoryId: jobData.subcategoryId,
        jobType: jobData.jobType?._id || jobData.jobType,
        workplaceType: jobData.workplaceType || 'onsite',
        city: jobData.city,
        address1: jobData.address1,
        zipcode: jobData.zipcode,
        experience: jobData.experience || 0,
        noOfJobs: jobData.noOfJobs || 1,
        hideSalaryRange: jobData.hideSalaryRange,
        salaryMin: jobData.salaryMin,
        salaryMax: jobData.salaryMax,
        isUrgent: jobData.isUrgent,
        contactEmail: jobData.contactEmail,
        contactPhone: jobData.contactPhone,
        jobApplyLink: jobData.jobApplyLink,
        jobLink: jobData.jobLink,
        careerLevel: jobData.careerLevel?._id || jobData.careerLevel || '',
        educationId: jobData.educationId?._id || jobData.educationId || '',
        showContact: jobData.showContact || false,
        currency: jobData.currency || 'USD',
      })
      setDescription(jobData.description || '')
      setQualifications(jobData.qualifications || '')
      setTags(jobData.tags || [])
    }
  }, [jobData, reset])

  // Fetch categories & job types
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getCategories().then(r => r.data?.categories || []),
    staleTime: Infinity,
  })
  const { data: careerLevelsData } = useQuery({
    queryKey: ['career-levels'],
    queryFn: () => categoriesAPI.getCareerLevels().then(r => r.data?.data || []),
    staleTime: Infinity,
  })
  const { data: jobTypesData } = useQuery({
    queryKey: ['job-types'],
    queryFn: () => categoriesAPI.getJobTypes().then(r => r.data?.jobTypes || []),
    staleTime: Infinity,
  })

  // Check package
  const { data: pkgData } = useQuery({
    queryKey: ['my-package'],
    queryFn: () => packageAPI.getMyPackage().then(r => r.data?.package),
  })

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? jobsAPI.update(id, data) : jobsAPI.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Job updated successfully!' : 'Job posted! Pending admin review.')
      qc.invalidateQueries(['my-jobs'])
      navigate('/employer/jobs')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save job'),
  })

  // const onSubmit = (data) => {
  //   if (!description.trim()) { toast.error('Job description is required'); return }
  //   mutation.mutate({ ...data, description, qualifications, tags })
  // }

  const onSubmit = (data) => {
    if (!description.trim()) { toast.error('Job description is required'); return }
    
    // ── Remove empty ObjectId fields ──────────────────────────
    const cleanData = { ...data, description, qualifications, tags }
    if (!cleanData.careerLevel) delete cleanData.careerLevel
    if (!cleanData.educationId) delete cleanData.educationId
    if (!cleanData.categoryId)  delete cleanData.categoryId
    if (!cleanData.jobType)     delete cleanData.jobType
    if (!cleanData.subcategoryId) delete cleanData.subcategoryId
    if (!cleanData.departmentId)  delete cleanData.departmentId
    // ──────────────────────────────────────────────────────────
    
    mutation.mutate(cleanData)
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag))

  // Package limit check
  const packageInfo = pkgData

  const hasPackage =
    packageInfo &&
    packageInfo.isActive &&
    new Date(packageInfo.endDate) > new Date() &&
    (
      packageInfo.remainingJobs === -1 ||
      packageInfo.remainingJobs > 0
    )

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl border border-gray-200 dark:border-dark-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="page-title mb-0">{isEdit ? 'Edit Job' : 'Post a New Job'}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {isEdit ? 'Update your job listing details' : 'Fill in the details below to post your job'}
          </p>
        </div>
      </div>

      {/* Package Warning */}
      {!isEdit && !hasPackage && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl mb-6">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">No active package</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              You need an active package to post jobs.{' '}
              <a href="/employer/packages" className="underline font-medium">View Packages →</a>
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Basic Info ─────────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-5">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Job Title *</label>
              <input {...register('title', { required: 'Job title is required', minLength: { value: 5, message: 'Min 5 characters' } })}
                placeholder="e.g. Senior React Developer"
                className={`input ${errors.title ? 'input-error' : ''}`} />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category *</label>
                <select {...register('categoryId', { required: 'Category required' })}
                  className={`input ${errors.categoryId ? 'input-error' : ''}`}>
                  <option value="">Select Category</option>
                  {categoriesData?.map(c => <option key={c._id} value={c._id}>{c.catTitle}</option>)}
                </select>
                {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
              </div>
              <div>
                <label className="label">Job Type</label>
                <select {...register('jobType')} className="input">
                  <option value="">Select Type</option>
                  {jobTypesData?.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                </select>
              </div>
            </div>

            {/* Career Level & Education — grid cols-2 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Career Level</label>
                <select {...register('careerLevel')} className="input">
                  <option value="">Select Career Level</option>
                  {careerLevelsData?.map(c => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Currency</label>
                <select {...register('currency')} className="input">
                  {['USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Workplace Type</label>
                <select {...register('workplaceType')} className="input">
                  {WORKPLACE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Experience Required</label>
                <select {...register('experience')} className="input">
                  {EXPERIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Number of Openings</label>
                <input {...register('noOfJobs', { min: 1 })} type="number" min="1" className="input" />
              </div>
            </div>

            {/* Urgent Toggle */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-dark-800 rounded-xl">
              <input {...register('isUrgent')} type="checkbox" id="isUrgent"
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" />
              <div>
                <label htmlFor="isUrgent" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
                  🔥 Mark as Urgent Hiring
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Urgent jobs get more visibility and a special badge</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Description ────────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-5">Job Description *</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={8}
                placeholder="Describe the role, responsibilities, day-to-day activities..."
                className="input resize-none"
              />
            </div>
            <div>
              <label className="label">Requirements & Qualifications</label>
              <textarea
                value={qualifications}
                onChange={e => setQualifications(e.target.value)}
                rows={5}
                placeholder="List the required skills, education, certifications..."
                className="input resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Location ───────────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-5">Location</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City</label>
              <input {...register('city')} placeholder="e.g. New York" className="input" />
            </div>
            <div>
              <label className="label">Zip Code</label>
              <input {...register('zipcode')} placeholder="e.g. 10001" className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Address (Optional)</label>
              <input {...register('address1')} placeholder="Street address" className="input" />
            </div>
          </div>
        </div>

        {/* ── Salary ─────────────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-5">Salary</h2>
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
            <input {...register('hideSalaryRange')} type="checkbox" id="hideSalary"
              className="w-4 h-4 rounded text-primary-600" />
            <label htmlFor="hideSalary" className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
              Hide salary range (Show "Negotiable")
            </label>
          </div>
          {!hideSalary && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Minimum Salary ($/yr)</label>
                <input {...register('salaryMin')} type="number" placeholder="50000" className="input" />
              </div>
              <div>
                <label className="label">Maximum Salary ($/yr)</label>
                <input {...register('salaryMax')} type="number" placeholder="80000" className="input" />
              </div>
            </div>
          )}
        </div>

        {/* ── Apply Method ───────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-5">Application Method</h2>
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
            <input {...register('jobApplyLink')} type="checkbox" id="externalApply"
              className="w-4 h-4 rounded text-primary-600" />
            <label htmlFor="externalApply" className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
              Use external application link (redirect to your website)
            </label>
          </div>
          {jobApplyLink && (
            <div>
              <label className="label">Application URL *</label>
              <input {...register('jobLink')} type="url" placeholder="https://yourcompany.com/apply/..."
                className="input" />
            </div>
          )}
        </div>

        {/* ── Contact ────────────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-5">Contact Information</h2>

            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
              <input {...register('showContact')} type="checkbox" id="showContact"
                className="w-4 h-4 rounded text-primary-600" />
              <label htmlFor="showContact" className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                Show contact details publicly on job listing
              </label>
            </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Email</label>
              <input {...register('contactEmail')} type="email" placeholder="hr@company.com" className="input" />
            </div>
            <div>
              <label className="label">Contact Phone</label>
              <input {...register('contactPhone')} type="tel" placeholder="+1 234 567 8900" className="input" />
            </div>
          </div>
        </div>

        {/* ── Tags ───────────────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-5">Tags</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Add relevant tags to help candidates find your job (max 10)</p>
          <div className="flex gap-2 mb-3">
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="e.g. react, nodejs, remote-friendly..."
              className="input flex-1" />
            <button type="button" onClick={addTag} className="btn-secondary px-4">
              <Plus size={16} />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="badge badge-primary flex items-center gap-1">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Submit ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pb-8">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary px-8">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending || (!isEdit && !hasPackage)}
            className="btn-primary px-8">
            {mutation.isPending ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : <Save size={15} />}
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Job' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  )
}
