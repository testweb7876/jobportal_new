import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import {
  ArrowLeft, FileText, Star, Eye, Mail, Phone, Globe,
  Briefcase, GraduationCap, Languages, MapPin, Tag, Zap,
  Share2, Upload, Trash2, Lock,
} from 'lucide-react'
import { Badge, Modal } from '@/components/common/UI'
import { formatDistanceToNow } from 'date-fns'
import api from '@/services/api'
import { resumeAPI } from '@/services/api'
import toast from 'react-hot-toast'

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-primary-600" />
        <h2 className="font-display font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 w-32 flex-shrink-0">{label}</span>
      <span className="text-gray-800 dark:text-gray-100 font-medium">{value}</span>
    </div>
  )
}

export default function ResumeDetails() {
  const { id } = useParams()
  const qc = useQueryClient()
  const fileRef = useRef()
  const [shareLink, setShareLink] = useState(null)
  const [visibilityModal, setVisibilityModal] = useState(false)
  const [visibilityVal, setVisibilityVal] = useState('public')

  const { data, isLoading } = useQuery({
    queryKey: ['resume', id],
    queryFn: async () => {
      const res = await api.get(`/resumes/${id}`)
      const resume = res.data?.resume || res.data?.data
      setVisibilityVal(resume?.visibility || 'public')
      return resume
    },
  })

  const shareMutation = useMutation({
    mutationFn: () => resumeAPI.generateShareLink(id),
    onSuccess: (res) => {
      const token = res.data?.shareToken || res.data?.data?.shareToken
      const link  = `${window.location.origin}/resumes/share/${token}`
      setShareLink(link)
      navigator.clipboard.writeText(link)
      toast.success('Share link copied!')
    },
    onError: () => toast.error('Failed to generate link'),
  })

  const featureMutation = useMutation({
    mutationFn: () => resumeAPI.toggleFeatured(id),
    onSuccess: () => { toast.success('Updated!'); qc.invalidateQueries(['resume', id]) },
    onError: () => toast.error('Failed'),
  })

  const visibilityMutation = useMutation({
    mutationFn: (vals) => resumeAPI.setVisibility(id, vals),
    onSuccess: () => {
      toast.success('Visibility updated!')
      setVisibilityModal(false)
      qc.invalidateQueries(['resume', id])
    },
    onError: () => toast.error('Failed'),
  })

  const fileUploadMutation = useMutation({
    mutationFn: (formData) => resumeAPI.uploadFile(id, formData),
    onSuccess: () => { toast.success('File uploaded!'); qc.invalidateQueries(['resume', id]) },
    onError: () => toast.error('Upload failed'),
  })

  const deleteFileMutation = useMutation({
    mutationFn: (publicId) => resumeAPI.deleteFile(id, publicId),
    onSuccess: () => { toast.success('File deleted'); qc.invalidateQueries(['resume', id]) },
    onError: () => toast.error('Delete failed'),
  })

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    fileUploadMutation.mutate(formData)
    e.target.value = ''
  }

  if (isLoading) return (
    <div className="space-y-4 animate-pulse max-w-3xl">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="card p-5 h-28 bg-gray-100 dark:bg-dark-700 rounded-2xl" />
      ))}
    </div>
  )

  if (!data) return (
    <div className="card p-10 text-center text-gray-500 dark:text-gray-400">
      Resume not found.{' '}
      <Link to="/jobseeker/resumes" className="text-primary-600 hover:underline">Go back</Link>
    </div>
  )

  const skills = data.skills
    ? data.skills.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const tags = Array.isArray(data.tags)
    ? data.tags
    : data.tags?.split(',').map(t => t.trim()).filter(Boolean) || []

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/jobseeker/resumes" className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="page-title mb-0 truncate">{data.applicationTitle}</h1>
            {data.isFeaturedResume && <Star size={16} className="text-amber-500 fill-current flex-shrink-0" />}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {data.firstName} {data.lastName}
            {(data.updatedAt || data.createdAt) && (
              <> · Updated {formatDistanceToNow(new Date(data.updatedAt || data.createdAt), { addSuffix: true })}</>
            )}
          </p>
        </div>
        <Link to={`/jobseeker/resumes/${id}/edit`} className="btn-outline flex-shrink-0">Edit</Link>
      </div>

      {/* Quick Actions */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => shareMutation.mutate()}
            disabled={shareMutation.isPending}
            className="btn-outline btn-sm justify-center">
            <Share2 size={13} />
            {shareMutation.isPending ? 'Generating...' : 'Copy Share Link'}
          </button>
          <button
            onClick={() => featureMutation.mutate()}
            disabled={featureMutation.isPending}
            className={`btn-sm justify-center ${data.isFeaturedResume ? 'btn-warning' : 'btn-outline'}`}>
            <Star size={13} className={data.isFeaturedResume ? 'fill-current' : ''} />
            {data.isFeaturedResume ? 'Unfeature' : 'Feature'}
          </button>
          <button
            onClick={() => setVisibilityModal(true)}
            className="btn-outline btn-sm justify-center capitalize">
            {data.visibility === 'public' ? <Globe size={13} /> : <Lock size={13} />}
            {data.visibility || 'public'}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={fileUploadMutation.isPending}
            className="btn-outline btn-sm justify-center">
            <Upload size={13} />
            {fileUploadMutation.isPending ? 'Uploading...' : 'Upload PDF/DOC'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />

        {/* Uploaded files */}
        {data.files?.length > 0 && (
          <div className="border-t border-gray-100 dark:border-dark-700 pt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500">Attached Files</p>
            {data.files.map(file => (
              <div key={file.publicId} className="flex items-center gap-2">
                <FileText size={13} className="text-primary-600 flex-shrink-0" />
                <a
                  href={file.secureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-xs text-primary-600 hover:underline">
                  {file.originalName || 'Resume file'}
                </a>
                <button
                  onClick={() => deleteFileMutation.mutate(file.publicId)}
                  disabled={deleteFileMutation.isPending}
                  className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {shareLink && (
          <div className="border-t border-gray-100 dark:border-dark-700 pt-3">
            <p className="text-xs text-gray-500 mb-1">Share link (copied)</p>
            <p className="text-xs font-mono text-primary-600 break-all bg-primary-50 dark:bg-primary-900/20 px-3 py-2 rounded-lg">
              {shareLink}
            </p>
          </div>
        )}
      </div>

      {/* ATS + Status */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="text-primary-600" />
          <h2 className="font-display font-bold text-gray-900 dark:text-white">Resume Stats</h2>
        </div>
        {data.atsScore > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">ATS Score</span>
              <span className="font-bold text-primary-600">{data.atsScore}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full">
              <div className="h-2 bg-primary-600 rounded-full transition-all" style={{ width: `${data.atsScore}%` }} />
            </div>
          </div>
        )}
        {data.completionPercentage > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">Profile Completion</span>
              <span className="font-bold text-emerald-600">{data.completionPercentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full">
              <div className="h-2 bg-emerald-500 rounded-full transition-all" style={{ width: `${data.completionPercentage}%` }} />
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant={data.published ? 'success' : 'gray'}>{data.published ? 'Published' : 'Draft'}</Badge>
          <Badge variant={data.searchable ? 'primary' : 'gray'}>{data.searchable ? 'Searchable' : 'Hidden'}</Badge>
          {data.quickApply  && <Badge variant="warning">Quick Apply</Badge>}
          {data.visibility  && <Badge variant="gray" className="capitalize">{data.visibility}</Badge>}
          {data.viewsCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Eye size={12} /> {data.viewsCount} views
            </span>
          )}
        </div>
      </div>

      {/* Contact */}
      <Section icon={Mail} title="Contact Information">
        <div className="space-y-2">
          <Row label="Email"           value={data.emailAddress} />
          <Row label="Phone"           value={data.cell} />
          <Row label="Gender"          value={data.gender} />
          <Row label="Nationality"     value={data.nationality} />
          <Row label="Expected Salary" value={data.salaryFixed} />
        </div>
      </Section>

      {data.addresses?.length > 0 && (
        <Section icon={MapPin} title="Address">
          {data.addresses.map((a, i) => (
            <div key={i} className="text-sm text-gray-700 dark:text-gray-200">
              {a.address}{a.address && a.addressCity ? ', ' : ''}{a.addressCity}
            </div>
          ))}
        </Section>
      )}

      {data.resume && (
        <Section icon={FileText} title="Professional Summary">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{data.resume}</p>
        </Section>
      )}

      {skills.length > 0 && (
        <Section icon={Zap} title="Skills">
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <span key={skill} className="px-3 py-1 text-xs rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium">
                {skill}
              </span>
            ))}
          </div>
        </Section>
      )}

      {(data.keywords || tags.length > 0) && (
        <Section icon={Tag} title="Keywords & Tags">
          {data.keywords && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Keywords</p>
              <p className="text-sm text-gray-700 dark:text-gray-200">{data.keywords}</p>
            </div>
          )}
          {tags.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="px-2.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {data.institutes?.length > 0 && (
        <Section icon={GraduationCap} title="Education">
          <div className="space-y-4">
            {data.institutes.map((inst, i) => (
              <div key={i} className="p-4 border border-gray-100 dark:border-dark-600 rounded-xl space-y-1">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{inst.institute}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {inst.instituteCertificateName}{inst.instituteCertificateName && inst.instituteStudyArea ? ' · ' : ''}{inst.instituteStudyArea}
                </p>
                {(inst.fromDate || inst.toDate) && (
                  <p className="text-xs text-gray-400">{inst.fromDate} — {inst.toDate}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.employers?.length > 0 && (
        <Section icon={Briefcase} title="Work Experience">
          <div className="space-y-4">
            {data.employers.map((emp, i) => (
              <div key={i} className="p-4 border border-gray-100 dark:border-dark-600 rounded-xl space-y-1">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{emp.employer}</p>
                <p className="text-sm text-primary-600 font-medium">{emp.employerPosition}</p>
                {emp.employerCity && <p className="text-xs text-gray-400">{emp.employerCity}</p>}
                <p className="text-xs text-gray-400">
                  {emp.employerFromDate} — {emp.employerCurrentStatus ? <span className="text-emerald-500 font-medium">Present</span> : emp.employerToDate}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.languages?.length > 0 && (
        <Section icon={Languages} title="Languages">
          <div className="flex flex-wrap gap-3">
            {data.languages.map((lang, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-dark-600 text-sm">
                <span className="font-medium text-gray-800 dark:text-gray-100">{lang.language}</span>
                {lang.proficiency && <span className="text-xs text-gray-400 capitalize">{lang.proficiency}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Visibility Modal */}
      <Modal open={visibilityModal} onClose={() => setVisibilityModal(false)} title="Update Visibility" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Who can see this resume?</label>
            <select value={visibilityVal} onChange={e => setVisibilityVal(e.target.value)} className="input">
              <option value="public">Public — Anyone can view</option>
              <option value="private">Private — Only you</option>
              <option value="restricted">Restricted — Only with share link</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setVisibilityModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => visibilityMutation.mutate({ visibility: visibilityVal })}
              disabled={visibilityMutation.isPending}
              className="btn-primary flex-1">
              {visibilityMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}