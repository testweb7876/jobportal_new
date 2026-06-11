import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../services/api'

export default function EditResume() {
  const { id } = useParams()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  // GET Resume
  const { data, isLoading } = useQuery({
    queryKey: ['resume', id],
    queryFn: async () => {
      const res = await api.get(`/resumes/${id}`)
      return res.data.resume
    },
  })

  // Fill form
  useEffect(() => {
    if (data) {
      reset(data)
    }
  }, [data, reset])

  // UPDATE Resume
  const updateMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await api.patch(`/resumes/${id}`, formData)
      return res.data
    },

    onSuccess: () => {
      navigate(`/jobseeker/resumes/${id}`)
    },
  })

  const onSubmit = (formData) => {
    updateMutation.mutate(formData)
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-6">

        <h1 className="text-2xl font-bold mb-6">
          Edit Resume
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >

          <div>
            <label className="block mb-2 font-medium">
              Resume Title
            </label>

            <input
              type="text"
              className="input w-full"
              {...register('applicationTitle', {
                required: 'Title required',
              })}
            />

            {errors.applicationTitle && (
              <p className="text-red-500 text-sm">
                {errors.applicationTitle.message}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <label className="block mb-2 font-medium">
                First Name
              </label>

              <input
                type="text"
                className="input w-full"
                {...register('firstName')}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Last Name
              </label>

              <input
                type="text"
                className="input w-full"
                {...register('lastName')}
              />
            </div>

          </div>

          <div>
            <label className="block mb-2 font-medium">
              Skills
            </label>

            <textarea
              rows="4"
              className="input w-full"
              {...register('skills')}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Resume Summary
            </label>

            <textarea
              rows="6"
              className="input w-full"
              {...register('resume')}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending
              ? 'Updating...'
              : 'Update Resume'}
          </button>

        </form>
      </div>
    </div>
  )
}