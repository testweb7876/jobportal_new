import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function CreateResume() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const createResumeMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/resumes', data)
      return res.data
    },
    onSuccess: () => {
      navigate('/jobseeker/resumes')
    },
  })

  const onSubmit = (data) => {
    createResumeMutation.mutate(data)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-6">
        <h1 className="text-2xl font-bold mb-6">
          Create Resume
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          <div>
            <label className="block mb-2 font-medium">
              Resume Title
            </label>

            <input
              type="text"
              className="input w-full"
              placeholder="Frontend Developer Resume"
              {...register('applicationTitle', {
                required: 'Resume title is required',
              })}
            />

            {errors.applicationTitle && (
              <p className="text-red-500 text-sm mt-1">
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

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <label className="block mb-2 font-medium">
                Email
              </label>

              <input
                type="email"
                className="input w-full"
                {...register('emailAddress')}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Phone
              </label>

              <input
                type="text"
                className="input w-full"
                {...register('cell')}
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
              placeholder="React, Node.js, MongoDB"
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
              placeholder="Write about yourself..."
              {...register('resume')}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={createResumeMutation.isPending}
          >
            {createResumeMutation.isPending
              ? 'Creating...'
              : 'Create Resume'}
          </button>

        </form>
      </div>
    </div>
  )
}