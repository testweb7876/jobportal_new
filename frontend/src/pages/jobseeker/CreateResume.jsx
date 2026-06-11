import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import { categoriesAPI } from '@/services/api'
import toast from 'react-hot-toast'

export default function CreateResume() {
  const navigate = useNavigate()

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      applicationTitle: '',
      firstName: '', lastName: '', gender: '', emailAddress: '', cell: '', nationality: '',
      resume: '', skills: '', keywords: '',
      published: true, searchable: true, visibility: 'public', quickApply: false,
      salaryFixed: '',
      institutes: [{ institute: '', instituteCertificateName: '', instituteStudyArea: '', fromDate: '', toDate: '' }],
      employers: [{ employer: '', employerPosition: '', employerCity: '', employerFromDate: '', employerToDate: '', employerCurrentStatus: 0 }],
      languages: [{ language: '', proficiency: '' }],
      addresses: [{ address: '', addressCity: '' }],
      tags: '',
    }
  })

  const { fields: institutes, append: addInstitute, remove: removeInstitute } = useFieldArray({ control, name: 'institutes' })
  const { fields: employers,  append: addEmployer,  remove: removeEmployer  } = useFieldArray({ control, name: 'employers' })
  const { fields: languages,  append: addLanguage,  remove: removeLanguage  } = useFieldArray({ control, name: 'languages' })
  const { fields: addresses,  append: addAddress,   remove: removeAddress   } = useFieldArray({ control, name: 'addresses' })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getCategories().then(r => r.data?.data?.categories || r.data?.categories || r.data?.data || []),
  })
  const { data: jobTypesData } = useQuery({
    queryKey: ['jobTypes'],
    queryFn: () => categoriesAPI.getJobTypes().then(r => r.data?.data?.jobTypes || r.data?.jobTypes || r.data?.data || []),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/resumes', data),
    onSuccess: () => { toast.success('Resume created!'); navigate('/jobseeker/resumes') },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create'),
  })

  const onSubmit = (data) => {
    const payload = {
      ...data,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }
    createMutation.mutate(payload)
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/jobseeker/resumes" className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="page-title mb-0">Create Resume</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Fill in your details to build a strong resume</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Basic Info ─────────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-gray-900 dark:text-white">Basic Information</h2>

          <div>
            <label className="label">Resume Title *</label>
            <input className={`input ${errors.applicationTitle ? 'input-error' : ''}`}
              placeholder="e.g. Senior React Developer"
              {...register('applicationTitle', { required: 'Title is required' })} />
            {errors.applicationTitle && <p className="mt-1 text-xs text-red-500">{errors.applicationTitle.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input className="input" placeholder="John" {...register('firstName')} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" placeholder="Doe" {...register('lastName')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Gender</label>
              <select className="input" {...register('gender')}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Nationality</label>
              <input className="input" placeholder="e.g. Indian" {...register('nationality')} />
            </div>
            <div>
              <label className="label">Expected Salary</label>
              <input className="input" placeholder="e.g. 8 LPA" {...register('salaryFixed')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="john@example.com" {...register('emailAddress')} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" type="tel" placeholder="+91 9876543210" {...register('cell')} />
            </div>
          </div>
        </div>

        {/* ── Summary & Skills ───────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-gray-900 dark:text-white">Summary & Skills</h2>

          <div>
            <label className="label">Professional Summary</label>
            <textarea className="input resize-none" rows={4}
              placeholder="Write about yourself, your experience and goals..."
              {...register('resume')} />
          </div>

          <div>
            <label className="label">Skills <span className="text-xs text-gray-400">(comma separated)</span></label>
            <textarea className="input resize-none" rows={3}
              placeholder="React, Node.js, MongoDB, TypeScript..."
              {...register('skills')} />
          </div>

          <div>
            <label className="label">Keywords <span className="text-xs text-gray-400">(for search visibility)</span></label>
            <input className="input" placeholder="Full Stack, Remote, Bangalore..."
              {...register('keywords')} />
          </div>

          <div>
            <label className="label">Tags <span className="text-xs text-gray-400">(comma separated)</span></label>
            <input className="input" placeholder="JavaScript, React, AWS..."
              {...register('tags')} />
          </div>
        </div>

        {/* ── Job Preferences ────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-gray-900 dark:text-white">Job Preferences</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Preferred Category</label>
              <select className="input" {...register('jobCategory')}>
                <option value="">Select category</option>
                {(categoriesData || []).map(c => <option key={c._id} value={c._id}>{c.catTitle}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Preferred Job Type</label>
              <select className="input" {...register('jobType')}>
                <option value="">Select type</option>
                {(jobTypesData || []).map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Education ──────────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-gray-900 dark:text-white">Education</h2>
            <button type="button" onClick={() => addInstitute({ institute: '', instituteCertificateName: '', instituteStudyArea: '', fromDate: '', toDate: '' })}
              className="btn-outline btn-sm"><Plus size={13} /> Add</button>
          </div>
          {institutes.map((field, i) => (
            <div key={field.id} className="p-4 border border-gray-200 dark:border-dark-600 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Education {i + 1}</p>
                {institutes.length > 1 && (
                  <button type="button" onClick={() => removeInstitute(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div>
                <label className="label">Institution Name</label>
                <input className="input" placeholder="e.g. IIT Delhi" {...register(`institutes.${i}.institute`)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Degree / Certificate</label>
                  <input className="input" placeholder="Bachelor of Technology" {...register(`institutes.${i}.instituteCertificateName`)} />
                </div>
                <div>
                  <label className="label">Field of Study</label>
                  <input className="input" placeholder="Computer Science" {...register(`institutes.${i}.instituteStudyArea`)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">From Year</label>
                  <input className="input" placeholder="2018" {...register(`institutes.${i}.fromDate`)} />
                </div>
                <div>
                  <label className="label">To Year</label>
                  <input className="input" placeholder="2022" {...register(`institutes.${i}.toDate`)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Work Experience ────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-gray-900 dark:text-white">Work Experience</h2>
            <button type="button" onClick={() => addEmployer({ employer: '', employerPosition: '', employerCity: '', employerFromDate: '', employerToDate: '', employerCurrentStatus: 0 })}
              className="btn-outline btn-sm"><Plus size={13} /> Add</button>
          </div>
          {employers.map((field, i) => (
            <div key={field.id} className="p-4 border border-gray-200 dark:border-dark-600 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Experience {i + 1}</p>
                {employers.length > 1 && (
                  <button type="button" onClick={() => removeEmployer(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Company Name</label>
                  <input className="input" placeholder="TechCorp Ltd" {...register(`employers.${i}.employer`)} />
                </div>
                <div>
                  <label className="label">Position / Role</label>
                  <input className="input" placeholder="Senior Developer" {...register(`employers.${i}.employerPosition`)} />
                </div>
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" placeholder="Bangalore" {...register(`employers.${i}.employerCity`)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">From (MM-YYYY)</label>
                  <input className="input" placeholder="2020-06" {...register(`employers.${i}.employerFromDate`)} />
                </div>
                <div>
                  <label className="label">To (MM-YYYY)</label>
                  <input className="input" placeholder="2023-12" {...register(`employers.${i}.employerToDate`)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id={`current-${i}`} value={1}
                  {...register(`employers.${i}.employerCurrentStatus`)}
                  className="w-4 h-4 accent-primary-600" />
                <label htmlFor={`current-${i}`} className="text-sm text-gray-600 dark:text-gray-300">Currently working here</label>
              </div>
            </div>
          ))}
        </div>

        {/* ── Languages ──────────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-gray-900 dark:text-white">Languages</h2>
            <button type="button" onClick={() => addLanguage({ language: '', proficiency: '' })}
              className="btn-outline btn-sm"><Plus size={13} /> Add</button>
          </div>
          {languages.map((field, i) => (
            <div key={field.id} className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="label">Language</label>
                <input className="input" placeholder="English" {...register(`languages.${i}.language`)} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="label">Proficiency</label>
                  <select className="input" {...register(`languages.${i}.proficiency`)}>
                    <option value="">Select</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="fluent">Fluent</option>
                    <option value="native">Native</option>
                  </select>
                </div>
                {languages.length > 1 && (
                  <button type="button" onClick={() => removeLanguage(i)} className="text-red-400 hover:text-red-600 mt-5">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Address ────────────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-gray-900 dark:text-white">Address</h2>
            <button type="button" onClick={() => addAddress({ address: '', addressCity: '' })}
              className="btn-outline btn-sm"><Plus size={13} /> Add</button>
          </div>
          {addresses.map((field, i) => (
            <div key={field.id} className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="label">Street Address</label>
                <input className="input" placeholder="Flat 302, Green Residency" {...register(`addresses.${i}.address`)} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="label">City</label>
                  <input className="input" placeholder="Bangalore" {...register(`addresses.${i}.addressCity`)} />
                </div>
                {addresses.length > 1 && (
                  <button type="button" onClick={() => removeAddress(i)} className="text-red-400 hover:text-red-600 mt-5">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Visibility ─────────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-gray-900 dark:text-white">Visibility Settings</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Visibility</label>
              <select className="input" {...register('visibility')}>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
            <div className="flex flex-col gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('published')} className="w-4 h-4 accent-primary-600" />
                <span className="text-sm text-gray-700 dark:text-gray-200">Published</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('searchable')} className="w-4 h-4 accent-primary-600" />
                <span className="text-sm text-gray-700 dark:text-gray-200">Searchable</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('quickApply')} className="w-4 h-4 accent-primary-600" />
                <span className="text-sm text-gray-700 dark:text-gray-200">Quick Apply</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Submit ─────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <Link to="/jobseeker/resumes" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={createMutation.isPending} className="btn-primary">
            {createMutation.isPending ? 'Creating...' : <><Save size={15} /> Create Resume</>}
          </button>
        </div>

      </form>
    </div>
  )
}