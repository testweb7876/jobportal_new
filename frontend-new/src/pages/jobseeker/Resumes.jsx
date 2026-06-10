import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, FileText, Trash2, Eye, Download, Star } from 'lucide-react'
import { resumeAPI } from '@/services/api'
import { EmptyState, Badge, Modal } from '@/components/common/UI'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function JSResumes() {
  const [deleteModal, setDeleteModal] = useState(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['my-resumes'],
    queryFn: () => resumeAPI.getMyResumes().then(r => r.data?.resumes || r.data?.data || []),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => resumeAPI.delete(id),
    onSuccess: () => { toast.success('Resume deleted'); setDeleteModal(null); qc.invalidateQueries(['my-resumes']) },
    onError: () => toast.error('Failed to delete'),
  })

  const resumes = data || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">My Resumes</h1>
          <p className="text-gray-500 dark:text-gray-400">{resumes.length} resume{resumes.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/jobseeker/resumes/create" className="btn-primary"><Plus size={15} /> Create Resume</Link>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array(2).fill(0).map((_, i) => <div key={i} className="card p-5 h-40 animate-pulse bg-gray-100 dark:bg-dark-700 rounded-2xl" />)}
        </div>
      ) : resumes.length === 0 ? (
        <EmptyState icon={FileText} title="No resumes yet"
          description="Create your first resume to start applying to jobs"
          action={<Link to="/jobseeker/resumes/create" className="btn-primary">Create Resume</Link>} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {resumes.map(resume => (
            <div key={resume._id} className="card p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{resume.applicationTitle}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Updated {formatDistanceToNow(new Date(resume.updatedAt || resume.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {resume.isFeaturedResume && <Star size={14} className="text-amber-500 fill-current flex-shrink-0" />}
              </div>
              {resume.atsScore > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">ATS Score</span>
                    <span className="font-bold text-primary-600">{resume.atsScore}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-dark-700 rounded-full">
                    <div className="h-1.5 bg-primary-600 rounded-full" style={{ width: `${resume.atsScore}%` }} />
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-dark-700">
                <Badge variant={resume.published ? 'success' : 'gray'}>{resume.published ? 'Published' : 'Draft'}</Badge>
                <Badge variant={resume.searchable ? 'primary' : 'gray'}>{resume.searchable ? 'Searchable' : 'Hidden'}</Badge>
              </div>
              <div className="flex gap-2 mt-3">
                <Link to={`/jobseeker/resumes/${resume._id}`} className="btn-secondary btn-sm flex-1 justify-center">
                  <Eye size={13} /> View
                </Link>
                <button onClick={() => setDeleteModal(resume)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Resume">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Delete <strong>"{deleteModal?.applicationTitle}"</strong>? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => deleteMutation.mutate(deleteModal._id)} disabled={deleteMutation.isPending} className="btn-danger flex-1">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
