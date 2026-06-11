import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

export default function ResumeDetails() {
  const { id } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['resume', id],
    queryFn: async () => {
      const res = await api.get(`/resumes/${id}`)
      return res.data.resume
    },
  })

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  if (!data) {
    return <div className="p-6">Resume not found</div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="card p-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {data.applicationTitle}
            </h1>

            <p className="text-gray-500 mt-1">
              {data.firstName} {data.lastName}
            </p>
          </div>

          <Link
            to={`/jobseeker/resumes/${id}/edit`}
            className="btn-outline"
          >
            Edit Resume
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="card p-4">
            <h2 className="font-semibold mb-3">
              Contact Information
            </h2>

            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> {data.emailAddress}</p>
              <p><strong>Phone:</strong> {data.cell}</p>
              <p><strong>Nationality:</strong> {data.nationality}</p>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="font-semibold mb-3">
              Resume Stats
            </h2>

            <div className="space-y-2 text-sm">
              <p><strong>ATS Score:</strong> {data.atsScore}%</p>
              <p><strong>Completion:</strong> {data.completionPercentage}%</p>
              <p><strong>Views:</strong> {data.viewsCount}</p>
            </div>
          </div>

        </div>

        <div className="card p-4 mt-6">
          <h2 className="font-semibold mb-3">
            Skills
          </h2>

          <p>
            {data.skills || 'No skills added'}
          </p>
        </div>

        <div className="card p-4 mt-6">
          <h2 className="font-semibold mb-3">
            Resume Summary
          </h2>

          <p className="whitespace-pre-line">
            {data.resume || 'No summary added'}
          </p>
        </div>

      </div>
    </div>
  )
}