import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Mail, Phone, Download, FileText, Briefcase, GraduationCap, Globe, Linkedin, Github } from 'lucide-react'
import { resumeAPI } from '@/services/api'
import { Avatar, Badge } from '@/components/common/UI'

export default function EmpCandidateDetail() {
  const { id } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => resumeAPI.getOne(id).then(r => r.data?.resume || r.data?.data?.resume),
  })

  const resume = data

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )

  if (!resume) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Candidate not found</p>
      <Link to="/employer/candidates" className="btn-primary mt-4 inline-flex">Back to Candidates</Link>
    </div>
  )

  return (
    <div className="animate-fade-in max-w-4xl space-y-6">
      {/* Back */}
      <Link to="/employer/candidates"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Candidates
      </Link>

      {/* Header Card */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <Avatar
            src={resume.uid?.avatar?.secureUrl}
            name={`${resume.uid?.firstName} ${resume.uid?.lastName}`}
            size="xl"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
              {resume.uid?.firstName} {resume.uid?.lastName}
            </h1>
            <p className="text-primary-600 font-medium mt-0.5">{resume.applicationTitle}</p>

            <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
              {resume.addresses?.[0]?.addressCity && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {resume.addresses[0].addressCity}
                </span>
              )}
              {resume.emailAddress && (
                <span className="flex items-center gap-1">
                  <Mail size={13} /> {resume.emailAddress}
                </span>
              )}
              {resume.cell && (
                <span className="flex items-center gap-1">
                  <Phone size={13} /> {resume.cell}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant={resume.published ? 'success' : 'gray'}>
                {resume.published ? 'Available' : 'Not Available'}
              </Badge>
              {resume.isFeaturedResume && <Badge variant="warning">⭐ Featured</Badge>}
              {resume.atsScore > 0 && (
                <Badge variant="primary">ATS: {resume.atsScore}%</Badge>
              )}
            </div>
          </div>

          {/* Resume File Download */}
          {resume.files?.length > 0 && (
            <a href={resume.files[0].secureUrl} target="_blank" rel="noopener noreferrer"
              className="btn-outline btn-sm flex-shrink-0">
              <Download size={14} /> Download CV
            </a>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Skills */}
          {resume.skills && (
            <div className="card p-5">
              <h2 className="font-display font-bold text-gray-900 dark:text-white mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {resume.skills.split(',').map((skill, i) => (
                  <span key={i} className="badge badge-primary">{skill.trim()}</span>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {resume.employers?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Briefcase size={16} /> Work Experience
              </h2>
              <div className="space-y-4">
                {resume.employers.map((emp, i) => (
                  <div key={i} className="border-l-2 border-primary-200 dark:border-primary-800 pl-4">
                    <p className="font-semibold text-gray-900 dark:text-white">{emp.employerPosition}</p>
                    <p className="text-sm text-primary-600">{emp.employer}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {emp.employerFromDate} — {emp.employerCurrentStatus ? 'Present' : emp.employerToDate}
                    </p>
                    {emp.employerCity && <p className="text-xs text-gray-400">{emp.employerCity}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resume.institutes?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <GraduationCap size={16} /> Education
              </h2>
              <div className="space-y-4">
                {resume.institutes.map((inst, i) => (
                  <div key={i} className="border-l-2 border-emerald-200 dark:border-emerald-800 pl-4">
                    <p className="font-semibold text-gray-900 dark:text-white">{inst.instituteCertificateName}</p>
                    <p className="text-sm text-emerald-600">{inst.institute}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{inst.fromDate} — {inst.toDate}</p>
                    {inst.instituteStudyArea && <p className="text-xs text-gray-400">{inst.instituteStudyArea}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resume Summary */}
          {resume.resume && (
            <div className="card p-5">
              <h2 className="font-display font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText size={16} /> Summary
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{resume.resume}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Tags */}
          {resume.tags?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {resume.tags.map((tag, i) => (
                  <span key={i} className="badge badge-gray">#{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {resume.languages?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Languages</h3>
              <div className="space-y-2">
                {resume.languages.map((lang, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-200">{lang.language}</span>
                    <span className="text-gray-400">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job Preferences */}
          {resume.jobCategory && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Preferences</h3>
              <div className="space-y-2 text-sm">
                {resume.jobCategory?.catTitle && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium text-gray-900 dark:text-white">{resume.jobCategory.catTitle}</span>
                  </div>
                )}
                {resume.jobType?.title && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Job Type</span>
                    <span className="font-medium text-gray-900 dark:text-white">{resume.jobType.title}</span>
                  </div>
                )}
                {resume.salaryFixed && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expected Salary</span>
                    <span className="font-medium text-gray-900 dark:text-white">{resume.salaryFixed}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}