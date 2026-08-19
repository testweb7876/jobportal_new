import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, ThumbsUp } from 'lucide-react'
import { reviewAPI } from '@/services/api'
import { Modal, Avatar, EmptyState } from '@/components/common/UI'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

export default function ReviewsSection({ companyId }) {
  const { isAuthenticated } = useAuthStore()
  const qc = useQueryClient()
  const [writeModal, setWriteModal] = useState(false)
  const [form, setForm] = useState({ rating: 5, title: '', review: '', pros: '', cons: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['company-reviews', companyId],
    queryFn: () => reviewAPI.getForCompany(companyId).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (payload) => reviewAPI.create({ ...payload, companyId }),
    onSuccess: () => {
      toast.success('Review submitted! It will appear after moderation.')
      setWriteModal(false)
      qc.invalidateQueries(['company-reviews', companyId])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit review'),
  })

  const helpfulMutation = useMutation({
    mutationFn: (id) => reviewAPI.toggleHelpful(id),
    onSuccess: () => qc.invalidateQueries(['company-reviews', companyId]),
  })

  const reviews = data?.data || []
  const avgRating = data?.avgRating || 0
  const totalReviews = data?.totalReviews || 0

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Reviews</h2>
          {totalReviews > 0 && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <Star size={13} className="text-amber-500 fill-current" /> {avgRating} · {totalReviews} reviews
            </p>
          )}
        </div>
        {isAuthenticated && (
          <button onClick={() => setWriteModal(true)} className="btn-outline btn-sm">Write a Review</button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-dark-700 rounded-xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" description="Be the first to review this company." />
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r._id} className="border-b border-gray-100 dark:border-dark-700 pb-4 last:border-0">
              <div className="flex items-center gap-3 mb-2">
                <Avatar name={`${r.uid?.firstName} ${r.uid?.lastName}`} src={r.uid?.avatar?.secureUrl} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.uid?.firstName} {r.uid?.lastName}</p>
                  <div className="flex items-center gap-1">
                    {Array(5).fill(0).map((_, i) => (
                      <Star key={i} size={11} className={i < r.rating ? 'text-amber-500 fill-current' : 'text-gray-300'} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{r.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{r.review}</p>
              {r.employmentType && (
                <span className="badge badge-gray text-xs mt-2 capitalize">{r.employmentType.replace('_', ' ')}</span>
              )}
              {r.employerResponse?.text && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Employer response</p>
                  <p className="text-gray-700 dark:text-gray-200">{r.employerResponse.text}</p>
                </div>
              )}
              <button
                onClick={() => helpfulMutation.mutate(r._id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-600 mt-2">
                <ThumbsUp size={11} /> Helpful ({r.helpfulCount || 0})
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={writeModal} onClose={() => setWriteModal(false)} title="Write a Review">
        <div className="space-y-4">
          <div>
            <label className="label">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setForm({ ...form, rating: n })}>
                  <Star size={22} className={n <= form.rating ? 'text-amber-500 fill-current' : 'text-gray-300'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="input" placeholder="Summarize your experience" />
          </div>
          <div>
            <label className="label">Review *</label>
            <textarea value={form.review} onChange={e => setForm({ ...form, review: e.target.value })}
              rows={4} className="input resize-none" placeholder="Share your experience..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Pros</label>
              <textarea value={form.pros} onChange={e => setForm({ ...form, pros: e.target.value })}
                rows={2} className="input resize-none" />
            </div>
            <div>
              <label className="label">Cons</label>
              <textarea value={form.cons} onChange={e => setForm({ ...form, cons: e.target.value })}
                rows={2} className="input resize-none" />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Your name and profile photo will be shown publicly with this review.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setWriteModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.title || !form.review}
              className="btn-primary flex-1">
              {createMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}