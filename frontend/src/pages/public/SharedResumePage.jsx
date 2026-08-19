import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FileText, Mail, Phone, Globe, Briefcase, GraduationCap,
  Languages, MapPin, Tag, Zap, AlertCircle, ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/common/UI'
import { formatDistanceToNow } from 'date-fns'
import { resumeAPI } from '@/services/api'

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

export default function SharedResumePage() {
  const { token } = useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shared-resume', token],
    queryFn: () => resumeAPI.getShared(token).then(r => r.data?.resume || r.data?.data),
    retry: false,
  })

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-5 h-28 bg-gray-100 dark:bg-dark-700 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  // ── Error / Not Found ────────────────────────────────────────────────────
  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
            Resume not available
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            This share link is invalid, has expired, or the resume has been made private by its owner.
          </p>
          <Link to="/" className="btn-primary inline-flex mt-6">Go to Homepage</Link>
        </div>
      </div>
    )
  }

  const skills = data.skills
    ? data.skills.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const tags = Array.isArray(data.tags)
    ? data.tags
    : data.tags?.split(',').map(t => t.trim()).filter(Boolean) || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

        {/* Shared-view banner */}
        

        {/* Header */}
        <div className="card p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white truncate">
                {data.firstName} {data.lastName}
              </h1>
              <p className="text-primary-600 font-medium mt-0.5">{data.applicationTitle}</p>
              {(data.updatedAt || data.createdAt) && (
                <p className="text-xs text-gray-400 mt-1">
                  Last updated {formatDistanceToNow(new Date(data.updatedAt || data.createdAt), { addSuffix: true })}
                </p>
              )}
            </div>
            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
              <FileText size={24} className="text-primary-600" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-dark-700 text-sm">
            {data.emailAddress && (
              <a href={`mailto:${data.emailAddress}`} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-primary-600">
                <Mail size={14} /> {data.emailAddress}
              </a>
            )}
            {data.cell && (
              <a href={`tel:${data.cell}`} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-primary-600">
                <Phone size={14} /> {data.cell}
              </a>
            )}
          </div>
        </div>

        {/* Attached files */}
        {data.files?.length > 0 && (
            <div className="card p-5 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Attached Files</p>
                {data.files.map(file => (
                <a
                    key={file.publicId}
                    href={file.secureUrl}
                    download={file.filename || file.originalName || 'resume'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                >
                    <FileText size={14} className="flex-shrink-0" />
                    <span className="truncate">{file.filename || file.originalName || 'Resume file'}</span>
                    <ExternalLink size={11} className="flex-shrink-0" />
                </a>
                ))}
            </div>
        )}

        {/* Address */}
        {data.addresses?.length > 0 && (
          <Section icon={MapPin} title="Address">
            {data.addresses.map((a, i) => (
              <div key={i} className="text-sm text-gray-700 dark:text-gray-200">
                {a.address}{a.address && a.addressCity ? ', ' : ''}{a.addressCity}
              </div>
            ))}
          </Section>
        )}

        {/* Summary */}
        {data.resume && (
          <Section icon={FileText} title="Professional Summary">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
              {data.resume}
            </p>
          </Section>
        )}

        {/* Skills */}
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

        {/* Keywords & Tags */}
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

        {/* Education */}
        {data.institutes?.length > 0 && (
          <Section icon={GraduationCap} title="Education">
            <div className="space-y-4">
              {data.institutes.map((inst, i) => (
                <div key={i} className="p-4 border border-gray-100 dark:border-dark-600 rounded-xl space-y-1">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{inst.institute}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {inst.instituteCertificateName}
                    {inst.instituteCertificateName && inst.instituteStudyArea ? ' · ' : ''}
                    {inst.instituteStudyArea}
                  </p>
                  {(inst.fromDate || inst.toDate) && (
                    <p className="text-xs text-gray-400">{inst.fromDate} — {inst.toDate}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Experience */}
        {data.employers?.length > 0 && (
          <Section icon={Briefcase} title="Work Experience">
            <div className="space-y-4">
              {data.employers.map((emp, i) => (
                <div key={i} className="p-4 border border-gray-100 dark:border-dark-600 rounded-xl space-y-1">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{emp.employer}</p>
                  <p className="text-sm text-primary-600 font-medium">{emp.employerPosition}</p>
                  {emp.employerCity && <p className="text-xs text-gray-400">{emp.employerCity}</p>}
                  <p className="text-xs text-gray-400">
                    {emp.employerFromDate} —{' '}
                    {emp.employerCurrentStatus
                      ? <span className="text-emerald-500 font-medium">Present</span>
                      : emp.employerToDate}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Languages */}
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

        {/* Footer CTA */}
        <div className="text-center pt-4 pb-2">
          <p className="text-xs text-gray-400">
            Powered by <Link to="/" className="text-primary-600 font-medium hover:underline">JobPortal</Link>
          </p>
        </div>

      </div>
    </div>
  )
}