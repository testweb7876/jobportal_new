import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Plus, X, Save } from 'lucide-react'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function SkillsCard({ user, updateUser, qc }) {
  const [skills, setSkills] = useState(user?.skills || [])
  const [input, setInput] = useState('')

  const skillMutation = useMutation({
    mutationFn: (payload) => api.patch('/users/profile', { skills: payload }),

    onSuccess: (res) => {
      const updatedUser = res.data?.data?.user || res.data?.user

      updateUser(updatedUser)

      toast.success('Skills updated!')
      qc.invalidateQueries(['me'])
    },

    onError: () => {
      toast.error('Failed to update skills')
    },
  })

  const addSkill = () => {
    const value = input.trim()

    if (!value) return

    if (skills.includes(value)) {
      toast.error('Skill already exists')
      return
    }

    setSkills((prev) => [...prev, value])
    setInput('')
  }

  const removeSkill = (skill) => {
    setSkills((prev) => prev.filter((s) => s !== skill))
  }

  return (
    <div className="card p-6 space-y-4">
      <h2 className="font-display font-bold text-gray-900 dark:text-white">
        Skills
      </h2>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addSkill()
            }
          }}
          placeholder="Add skill..."
          className="input flex-1"
        />

        <button
          type="button"
          onClick={addSkill}
          className="btn-secondary px-4"
        >
          <Plus size={16} />
        </button>
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30"
            >
              <span className="text-sm">{skill}</span>

              <button
                type="button"
                onClick={() => removeSkill(skill)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => skillMutation.mutate(skills)}
          disabled={skillMutation.isPending}
          className="btn-primary"
        >
          {skillMutation.isPending
            ? 'Saving...'
            : (
              <>
                <Save size={15} />
                Save Skills
              </>
            )}
        </button>
      </div>
    </div>
  )
}