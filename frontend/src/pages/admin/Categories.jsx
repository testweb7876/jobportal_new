import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Tag, Briefcase } from 'lucide-react'
import { categoriesAPI, adminAPI } from '@/services/api'
import { Modal, EmptyState, Table } from '@/components/common/UI'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'categories', label: 'Categories',  icon: Tag },
  { key: 'job-types',  label: 'Job Types',   icon: Briefcase },
]

export default function AdminCategories() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab]   = useState('categories')
  const [modal, setModal]           = useState(false)
  const [editItem, setEditItem]     = useState(null)
  const [inputTitle, setInputTitle] = useState('')
  const [deleteModal, setDeleteModal] = useState(null)

  // ── fetch ──────────────────────────────────────────────────────────────────
  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesAPI.getCategories().then(r => r.data?.categories || []),
  })
  const { data: jobTypes, isLoading: jtLoading } = useQuery({
    queryKey: ['admin-job-types'],
    queryFn: () => categoriesAPI.getJobTypes().then(r => r.data?.jobTypes || []),
  })

  const isLoading = catLoading || jtLoading
  const items = activeTab === 'categories' ? (categories || []) : (jobTypes || [])

  // ── mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (title) =>
      activeTab === 'categories'
        ? adminAPI.createCategory({
            catTitle: title,
            alias: title
              .toLowerCase()
              .trim()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '')
          })
        : adminAPI.createJobType({ title }),

    onSuccess: () => {
      toast.success('Created!')
      close()
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
      qc.invalidateQueries({ queryKey: ['admin-job-types'] })
    },

    onError: (err) =>
      toast.error(err?.response?.data?.message || 'Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, title }) =>
      activeTab === 'categories'
        ? adminAPI.updateCategory(id, {
            catTitle: title,
            alias: title
              .toLowerCase()
              .trim()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '')
          })
        : adminAPI.updateJobType(id, { title }),

    onSuccess: () => {
      toast.success('Updated!')
      close()

      qc.invalidateQueries({ queryKey: ['admin-categories'] })
      qc.invalidateQueries({ queryKey: ['admin-job-types'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['job-types'] })
    },

    onError: (err) =>
      toast.error(err?.response?.data?.message || 'Update failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      activeTab === 'categories'
        ? adminAPI.deleteCategory(id)
        : adminAPI.deleteJobType(id),
    onSuccess: () => {
      toast.success('Deleted')
      setDeleteModal(null)
      qc.invalidateQueries(['admin-categories'])
      qc.invalidateQueries(['admin-job-types'])
    },
    onError: () => toast.error('Delete failed'),
  })

  // ── helpers ────────────────────────────────────────────────────────────────
  const close = () => { setModal(false); setEditItem(null); setInputTitle('') }

  const openCreate = () => {
    setEditItem(null)
    setInputTitle('')
    setModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setInputTitle(item.catTitle || item.title || '')
    setModal(true)
  }

  const handleSubmit = () => {
    if (!inputTitle.trim()) { toast.error('Title is required'); return }
    if (editItem) {
      updateMutation.mutate({ id: editItem._id, title: inputTitle.trim() })
    } else {
      createMutation.mutate(inputTitle.trim())
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">Categories</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage job categories and types</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={15} /> Add {activeTab === 'categories' ? 'Category' : 'Job Type'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors',
              activeTab === tab.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
            )}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card p-4 space-y-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-dark-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Tag} title={`No ${activeTab === 'categories' ? 'categories' : 'job types'} yet`}
          action={<button onClick={openCreate} className="btn-primary btn-sm"><Plus size={13} /> Add First</button>} />
      ) : (
        <div className="card overflow-hidden">
          <Table headers={['Title', 'Slug / ID', 'Actions']}>
            {items.map(item => (
              <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
                <td className="py-3.5 px-4">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {item.catTitle || item.title}
                  </p>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-xs text-gray-400 font-mono">{item.slug || item._id}</span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-400 hover:text-primary-600 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteModal(item)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modal}
        onClose={close}
        title={editItem
          ? `Edit ${activeTab === 'categories' ? 'Category' : 'Job Type'}`
          : `Add ${activeTab === 'categories' ? 'Category' : 'Job Type'}`}
        size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              value={inputTitle}
              onChange={e => setInputTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder={activeTab === 'categories' ? 'e.g. Information Technology' : 'e.g. Full Time'}
              className="input"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button onClick={close} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSubmit} disabled={isPending} className="btn-primary flex-1">
              {isPending ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Item" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Delete <strong>"{deleteModal?.catTitle || deleteModal?.title}"</strong>? Jobs using this will lose the reference.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => deleteMutation.mutate(deleteModal._id)}
              disabled={deleteMutation.isPending} className="btn-danger flex-1">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}