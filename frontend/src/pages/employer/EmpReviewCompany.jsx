import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, MessageSquare, Building2 } from 'lucide-react'
import { companyAPI, reviewAPI } from '@/services/api'
import { EmptyState, Avatar } from '@/components/common/UI'
import toast from 'react-hot-toast'

export default function EmpReviewCompany() {
  const qc = useQueryClient()
  const [replyingTo, setReplyingTo] = useState(null) // review id
  const [replyText, setReplyText] = useState('')

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['my-company'],
    queryFn: () => companyAPI.getMyCompany().then(r => r.data?.company),
  })

  const { data, isLoading: reviewsLoading } = useQuery({
    queryKey: ['company-reviews', company?._id],
    queryFn: () => reviewAPI.getForCompany(company._id, { limit: 50 }).then(r => r.data),
    enabled: !!company?._id,
  })

  const respondMutation = useMutation({
    mutationFn: ({ id, text }) => reviewAPI.respond(id, { text }),
    onSuccess: () => {
      toast.success('Response posted')
      setReplyingTo(null)
      setReplyText('')
      qc.invalidateQueries({ queryKey: ['company-reviews', company?._id] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to post response'),
  })

  const reviews = data?.data || []
  const avgRating = data?.avgRating || 0
  const totalReviews = data?.totalReviews || 0

  const isLoading = companyLoading || reviewsLoading

  if (!companyLoading && !company) {
    return (
      <div className="card p-10 text-center">
        <Building2 size={36} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">You need to create a company profile first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">Company Reviews</h1>
          {totalReviews > 0 ? (
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Star size={14} className="text-amber-500 fill-current" />
              {avgRating} average · {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No reviews yet</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="card p-5 h-28 bg-gray-100 dark:bg-dark-700 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" description="Reviews from candidates and employees will appear here once approved." />
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r._id} className="card p-5">
              <div className="flex items-start gap-3">
                <Avatar name={`${r.uid?.firstName} ${r.uid?.lastName}`} src={r.uid?.avatar?.secureUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {r.uid?.firstName} {r.uid?.lastName}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array(5).fill(0).map((_, i) => (
                      <Star key={i} size={12} className={i < r.rating ? 'text-amber-500 fill-current' : 'text-gray-300'} />
                    ))}
                    {r.employmentType && (
                      <span className="badge badge-gray text-xs ml-2 capitalize">{r.employmentType.replace('_', ' ')}</span>
                    )}
                  </div>

                  <p className="font-semibold text-sm text-gray-900 dark:text-white mt-3">{r.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{r.review}</p>

                  {(r.pros || r.cons) && (
                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                      {r.pros && (
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Pros</p>
                          <p className="text-sm text-gray-700 dark:text-gray-200">{r.pros}</p>
                        </div>
                      )}
                      {r.cons && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10">
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Cons</p>
                          <p className="text-sm text-gray-700 dark:text-gray-200">{r.cons}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Existing employer response */}
                  {r.employerResponse?.text ? (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Your response</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200">{r.employerResponse.text}</p>
                    </div>
                  ) : replyingTo === r._id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        rows={3}
                        placeholder="Write a response to this review..."
                        className="input resize-none" />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText('') }}
                          className="btn-secondary btn-sm">
                          Cancel
                        </button>
                        <button
                          onClick={() => respondMutation.mutate({ id: r._id, text: replyText })}
                          disabled={respondMutation.isPending || !replyText.trim()}
                          className="btn-primary btn-sm">
                          {respondMutation.isPending ? 'Posting...' : 'Post Response'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setReplyingTo(r._id); setReplyText('') }}
                      className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium mt-3">
                      <MessageSquare size={12} /> Respond
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}