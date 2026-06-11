import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  Building2, Camera, Globe, Linkedin, Twitter, Youtube,
  CheckCircle, Upload, X, Instagram, Facebook, Image, Trash2, Plus,
} from 'lucide-react'
import { companyAPI } from '@/services/api'
import api from '@/services/api'
import { Badge, Modal } from '@/components/common/UI'
import toast from 'react-hot-toast'

/* ── small section wrapper ─────────────────────────────────── */
function Section({ title, children }) {
  return (
    <div className="card p-6 space-y-5">
      <h2 className="font-display font-bold text-gray-900 dark:text-white">{title}</h2>
      {children}
    </div>
  )
}

export default function EmpCompany() {
  const qc = useQueryClient()
  const logoRef = useRef()
  const galleryRef = useRef()
  const verifyRef = useRef()

  const [logoLoading, setLogoLoading] = useState(false)
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [verifyModal, setVerifyModal] = useState(false)
  const [verifyFiles, setVerifyFiles] = useState([])
  const [deleteGalleryModal, setDeleteGalleryModal] = useState(null) // publicId

  /* ── fetch company ────────────────────────────────────────── */
  const { data: companyData, isLoading } = useQuery({
    queryKey: ['my-company'],
    queryFn: () => companyAPI.getMyCompany().then(r => r.data?.company),
  })

  /* ── form ─────────────────────────────────────────────────── */
  const { register, handleSubmit, formState: { isDirty, errors } } = useForm({
    values: {
      name:         companyData?.name         || '',
      alias:        companyData?.alias        || '',
      tagline:      companyData?.tagline      || '',
      description:  companyData?.description  || '',
      url:          companyData?.url          || '',
      contactEmail: companyData?.contactEmail || '',
      city:         companyData?.city         || '',
      address1:     companyData?.address1     || '',
      address2:     companyData?.address2     || '',
      metaDescription: companyData?.metaDescription || '',
      metaKeywords:    companyData?.metaKeywords    || '',
      'socialLinks.facebook':  companyData?.socialLinks?.facebook  || '',
      'socialLinks.twitter':   companyData?.socialLinks?.twitter   || '',
      'socialLinks.linkedin':  companyData?.socialLinks?.linkedin  || '',
      'socialLinks.youtube':   companyData?.socialLinks?.youtube   || '',
      'socialLinks.instagram': companyData?.socialLinks?.instagram || '',
      'socialLinks.website':   companyData?.socialLinks?.website   || '',
    },
  })

  /* ── update ───────────────────────────────────────────────── */
  const updateMutation = useMutation({
    mutationFn: (data) => companyAPI.update(companyData._id, data),
    onSuccess: () => { toast.success('Company updated!'); qc.invalidateQueries(['my-company']) },
    onError: () => toast.error('Update failed'),
  })

  const onSubmit = (data) => {
    const payload = {
      name:         data.name,
      alias:        data.alias,
      tagline:      data.tagline,
      description:  data.description,
      url:          data.url,
      contactEmail: data.contactEmail,
      city:         data.city,
      address1:     data.address1,
      address2:     data.address2,
      metaDescription: data.metaDescription,
      metaKeywords:    data.metaKeywords,
      socialLinks: {
        facebook:  data['socialLinks.facebook'],
        twitter:   data['socialLinks.twitter'],
        linkedin:  data['socialLinks.linkedin'],
        youtube:   data['socialLinks.youtube'],
        instagram: data['socialLinks.instagram'],
        website:   data['socialLinks.website'],
      },
    }
    updateMutation.mutate(payload)
  }

  /* ── create company ───────────────────────────────────────── */
  const createMutation = useMutation({
    mutationFn: (data) => companyAPI.create(data),
    onSuccess: () => { toast.success('Company created!'); qc.invalidateQueries(['my-company']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Create failed'),
  })

  /* ── logo upload ──────────────────────────────────────────── */
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoLoading(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      await companyAPI.uploadLogo(formData)
      toast.success('Logo uploaded!')
      qc.invalidateQueries(['my-company'])
    } catch { toast.error('Upload failed') }
    finally { setLogoLoading(false); e.target.value = '' }
  }

  /* ── gallery upload ───────────────────────────────────────── */
  const handleGalleryUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if ((companyData?.gallery?.length || 0) >= 10) {
      toast.error('Maximum 10 gallery images allowed')
      return
    }
    setGalleryLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      await api.post('/companies/gallery', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Image added to gallery!')
      qc.invalidateQueries(['my-company'])
    } catch { toast.error('Gallery upload failed') }
    finally { setGalleryLoading(false); e.target.value = '' }
  }

  /* ── gallery delete ───────────────────────────────────────── */
  const deleteGalleryMutation = useMutation({
    mutationFn: (publicId) => api.delete('/companies/gallery', { data: { publicId } }),
    onSuccess: () => { toast.success('Image removed'); setDeleteGalleryModal(null); qc.invalidateQueries(['my-company']) },
    onError: () => toast.error('Delete failed'),
  })

  /* ── verification submit ──────────────────────────────────── */
  const handleVerifySubmit = async () => {
    if (!verifyFiles.length) { toast.error('Please select documents'); return }
    try {
      const formData = new FormData()
      verifyFiles.forEach(f => formData.append('documents', f))
      await companyAPI.submitVerification(formData)
      toast.success('Verification submitted!')
      setVerifyModal(false)
      setVerifyFiles([])
      qc.invalidateQueries(['my-company'])
    } catch { toast.error('Submission failed') }
  }

  /* ── loading / empty states ───────────────────────────────── */
  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )

  if (!companyData) return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="page-title">Company Profile</h1>
      <div className="card p-8 text-center">
        <Building2 size={40} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Company Profile</h2>
        <p className="text-gray-500 mb-6">Set up your company profile to start posting jobs</p>
        <button onClick={() => createMutation.mutate({ name: 'My Company' })}
          disabled={createMutation.isPending} className="btn-primary">
          {createMutation.isPending ? 'Creating...' : 'Create Company Profile'}
        </button>
      </div>
    </div>
  )

  const gallery = companyData.gallery || []

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">Company Profile</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your company information</p>
        </div>
        <div className="flex items-center gap-2">
          {companyData.isVerified ? (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
              <CheckCircle size={16} /> Verified
            </span>
          ) : (
            <button onClick={() => setVerifyModal(true)} className="btn-outline btn-sm">
              <Upload size={14} /> Request Verification
            </button>
          )}
        </div>
      </div>

      {/* ── Logo ───────────────────────────────────────────────── */}
      <Section title="Company Logo">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-dark-700 border-2 border-gray-200 dark:border-dark-600 overflow-hidden flex items-center justify-center">
              {companyData.logo?.secureUrl
                ? <img src={companyData.logo.secureUrl} alt="" className="w-full h-full object-cover" />
                : <Building2 size={28} className="text-gray-400" />}
            </div>
            <button onClick={() => logoRef.current?.click()} disabled={logoLoading}
              className="absolute bottom-0 right-0 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors">
              {logoLoading
                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={12} className="text-white" />}
            </button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Company Logo</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or WebP. Recommended 400×400px.</p>
            {companyData.verificationStatus && companyData.verificationStatus !== 'not_submitted' && (
              <div className="mt-2">
                <Badge variant={
                  companyData.verificationStatus === 'approved' ? 'success'
                  : companyData.verificationStatus === 'pending'  ? 'warning'
                  : 'danger'
                } className="capitalize">
                  {companyData.verificationStatus}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ── Company Info Form ───────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Basic Info */}
        <Section title="Company Information">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Company Name *</label>
              <input {...register('name', { required: 'Name is required' })} className={`input ${errors.name ? 'input-error' : ''}`} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Alias / Short Name</label>
              <input {...register('alias')} placeholder="e.g. TechCo" className="input" />
            </div>
          </div>

          <div>
            <label className="label">Tagline</label>
            <input {...register('tagline')} placeholder="Short description shown in listings..." className="input" />
          </div>

          <div>
            <label className="label">About Company</label>
            <textarea {...register('description')} rows={5} className="input resize-none"
              placeholder="Tell candidates about your company culture, mission, and values..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Website</label>
              <div className="relative">
                <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register('url')} type="url" placeholder="https://company.com" className="input pl-9" />
              </div>
            </div>
            <div>
              <label className="label">Contact Email</label>
              <input {...register('contactEmail')} type="email" className="input" />
            </div>
          </div>
        </Section>

        {/* Location */}
        <Section title="Location">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City</label>
              <input {...register('city')} placeholder="e.g. New York" className="input" />
            </div>
            <div>
              <label className="label">Address Line 1</label>
              <input {...register('address1')} placeholder="Street address" className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Address Line 2</label>
              <input {...register('address2')} placeholder="Apartment, suite, floor, etc." className="input" />
            </div>
          </div>
        </Section>

        {/* Social Media */}
        <Section title="Social Media">
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'socialLinks.linkedin',  Icon: Linkedin,  placeholder: 'LinkedIn URL'  },
              { name: 'socialLinks.twitter',   Icon: Twitter,   placeholder: 'Twitter / X URL' },
              { name: 'socialLinks.facebook',  Icon: Facebook,  placeholder: 'Facebook URL'  },
              { name: 'socialLinks.instagram', Icon: Instagram, placeholder: 'Instagram URL' },
              { name: 'socialLinks.youtube',   Icon: Youtube,   placeholder: 'YouTube URL'   },
              { name: 'socialLinks.website',   Icon: Globe,     placeholder: 'Other Website URL' },
            ].map(({ name, Icon, placeholder }) => (
              <div key={name} className="relative">
                <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register(name)} type="url" placeholder={placeholder} className="input pl-9" />
              </div>
            ))}
          </div>
        </Section>

        {/* SEO */}
        <Section title="SEO Settings">
          <div>
            <label className="label">Meta Description</label>
            <textarea {...register('metaDescription')} rows={3} className="input resize-none"
              placeholder="Brief description for search engines (150–160 characters recommended)..." />
          </div>
          <div>
            <label className="label">Meta Keywords <span className="text-xs text-gray-400">(comma separated)</span></label>
            <input {...register('metaKeywords')} placeholder="recruitment, software jobs, IT company..." className="input" />
          </div>
        </Section>

        {/* Submit */}
        <div className="flex justify-end">
          <button type="submit" disabled={updateMutation.isPending || !isDirty} className="btn-primary">
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* ── Gallery ────────────────────────────────────────────── */}
      <Section title={`Gallery (${gallery.length}/10)`}>
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3">
          Showcase your office, team, and culture. Up to 10 images.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {gallery.map((img) => (
            <div key={img.publicId} className="relative group rounded-xl overflow-hidden h-28 bg-gray-100 dark:bg-dark-700">
              <img src={img.secureUrl} alt={img.caption || ''} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => setDeleteGalleryModal(img.publicId)}
                  className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                  <Trash2 size={14} className="text-white" />
                </button>
              </div>
              {img.caption && (
                <p className="absolute bottom-0 left-0 right-0 text-xs text-white bg-black/40 px-2 py-1 truncate">
                  {img.caption}
                </p>
              )}
            </div>
          ))}

          {gallery.length < 10 && (
            <button onClick={() => galleryRef.current?.click()} disabled={galleryLoading}
              className="h-28 rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-600 flex flex-col items-center justify-center gap-1 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors">
              {galleryLoading
                ? <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                : <>
                    <Plus size={18} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Add Photo</span>
                  </>}
            </button>
          )}
        </div>
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
      </Section>

      {/* ── Verification Modal ─────────────────────────────────── */}
      <Modal open={verifyModal} onClose={() => { setVerifyModal(false); setVerifyFiles([]) }} title="Request Verification">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Upload business registration documents to get your company verified. Verification typically takes 2–3 business days.
          </p>
          <div>
            <label className="label">Documents <span className="text-xs text-gray-400">(PDF, JPG, PNG — max 5 files)</span></label>
            <div
              className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
              onClick={() => verifyRef.current?.click()}>
              <Upload size={24} className="text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Click to upload or drag files here</p>
              <input ref={verifyRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={e => setVerifyFiles(Array.from(e.target.files))} />
            </div>
            {verifyFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {verifyFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="flex-1 truncate">{f.name}</span>
                    <button onClick={() => setVerifyFiles(prev => prev.filter((_, j) => j !== i))}>
                      <X size={14} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setVerifyModal(false); setVerifyFiles([]) }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleVerifySubmit} className="btn-primary flex-1">Submit for Review</button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Gallery Confirm ─────────────────────────────── */}
      <Modal open={!!deleteGalleryModal} onClose={() => setDeleteGalleryModal(null)} title="Remove Image">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Remove this image from your gallery? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteGalleryModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => deleteGalleryMutation.mutate(deleteGalleryModal)}
              disabled={deleteGalleryMutation.isPending} className="btn-danger flex-1">
              {deleteGalleryMutation.isPending ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}