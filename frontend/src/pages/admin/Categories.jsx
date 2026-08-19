import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Tag, Briefcase, TrendingUp, GraduationCap, Coins } from 'lucide-react'
import { categoriesAPI, adminAPI } from '@/services/api'
import { Modal, EmptyState, Table } from '@/components/common/UI'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'categories',    label: 'Categories',    icon: Tag },
  { key: 'job-types',     label: 'Job Types',     icon: Briefcase },
  { key: 'career-levels', label: 'Career Levels', icon: TrendingUp },
  { key: 'education',     label: 'Education',     icon: GraduationCap },
  { key: 'currencies',    label: 'Currencies',    icon: Coins },
]

export default function AdminCategories() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab]     = useState('categories')
  const [modal, setModal]             = useState(false)
  const [editItem, setEditItem]       = useState(null)
  const [inputTitle, setInputTitle]   = useState('')
  const [inputCode, setInputCode]     = useState('')
  const [inputSymbol, setInputSymbol] = useState('')
  const [deleteModal, setDeleteModal] = useState(null)

  const activeTabLabel = TABS.find(t => t.key === activeTab)?.label || 'Item'
  // Singular label for buttons/modals (drop trailing 's'/'ies')
  const activeTabSingular = activeTabLabel.endsWith('ies')
    ? activeTabLabel.replace(/ies$/, 'y')
    : activeTabLabel.replace(/s$/, '')

  // ── fetch ──────────────────────────────────────────────────────────────────
  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesAPI.getCategories().then(r => r.data?.categories || []),
  })
  const { data: jobTypes, isLoading: jtLoading } = useQuery({
    queryKey: ['admin-job-types'],
    queryFn: () => categoriesAPI.getJobTypes().then(r => r.data?.jobTypes || []),
  })
  const { data: careerLevels, isLoading: clLoading } = useQuery({
    queryKey: ['admin-career-levels'],
    queryFn: () => categoriesAPI.getCareerLevels().then(r => r.data?.careerLevels || []),
  })
  const { data: education, isLoading: eduLoading } = useQuery({
    queryKey: ['admin-education'],
    queryFn: () => categoriesAPI.getEducation().then(r => r.data?.education || []),
  })
  const { data: currencies, isLoading: curLoading } = useQuery({
    queryKey: ['admin-currencies'],
    queryFn: () => categoriesAPI.getCurrencies().then(r => r.data?.currencies || []),
  })

  const isLoading = catLoading || jtLoading || clLoading || eduLoading || curLoading

  const items =
    activeTab === 'categories'    ? (categories || []) :
    activeTab === 'job-types'     ? (jobTypes || []) :
    activeTab === 'career-levels' ? (careerLevels || []) :
    activeTab === 'education'     ? (education || []) :
    (currencies || [])

  const isCurrencyTab = activeTab === 'currencies'

  // ── invalidate everything (keeps job-post form + admin list in sync) ───────
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['admin-categories'] })
    qc.invalidateQueries({ queryKey: ['admin-job-types'] })
    qc.invalidateQueries({ queryKey: ['admin-career-levels'] })
    qc.invalidateQueries({ queryKey: ['admin-education'] })
    qc.invalidateQueries({ queryKey: ['admin-currencies'] })
    qc.invalidateQueries({ queryKey: ['categories'] })
    qc.invalidateQueries({ queryKey: ['job-types'] })
    qc.invalidateQueries({ queryKey: ['career-levels'] })
    qc.invalidateQueries({ queryKey: ['education'] })
    qc.invalidateQueries({ queryKey: ['currencies'] })
  }

  // ── mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload) => {
      if (activeTab === 'categories') {
        return adminAPI.createCategory({
          catTitle: payload.title,
          alias: payload.title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        })
      }
      if (activeTab === 'job-types')     return adminAPI.createJobType({ title: payload.title })
      if (activeTab === 'career-levels') return categoriesAPI.createCareerLevel({ title: payload.title })
      if (activeTab === 'education')     return categoriesAPI.createEducation({ title: payload.title })
      return categoriesAPI.createCurrency({ title: payload.title, code: payload.code, symbol: payload.symbol })
    },
    onSuccess: () => { toast.success('Created!'); close(); invalidateAll() },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      if (activeTab === 'categories') {
        return adminAPI.updateCategory(id, {
          catTitle: payload.title,
          alias: payload.title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        })
      }
      if (activeTab === 'job-types')     return adminAPI.updateJobType(id, { title: payload.title })
      if (activeTab === 'career-levels') return categoriesAPI.updateCareerLevel(id, { title: payload.title })
      if (activeTab === 'education')     return categoriesAPI.updateEducation(id, { title: payload.title })
      return categoriesAPI.updateCurrency(id, { title: payload.title, code: payload.code, symbol: payload.symbol })
    },
    onSuccess: () => { toast.success('Updated!'); close(); invalidateAll() },
    onError: (err) => toast.error(err?.response?.data?.message || 'Update failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      if (activeTab === 'categories')    return adminAPI.deleteCategory(id)
      if (activeTab === 'job-types')     return adminAPI.deleteJobType(id)
      if (activeTab === 'career-levels') return categoriesAPI.deleteCareerLevel(id)
      if (activeTab === 'education')     return categoriesAPI.deleteEducation(id)
      return categoriesAPI.deleteCurrency(id)
    },
    onSuccess: () => { toast.success('Deleted'); setDeleteModal(null); invalidateAll() },
    onError: () => toast.error('Delete failed'),
  })

  // ── helpers ────────────────────────────────────────────────────────────────
  const close = () => {
    setModal(false); setEditItem(null)
    setInputTitle(''); setInputCode(''); setInputSymbol('')
  }

  const openCreate = () => {
    setEditItem(null)
    setInputTitle(''); setInputCode(''); setInputSymbol('')
    setModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setInputTitle(item.catTitle || item.title || '')
    setInputCode(item.code || '')
    setInputSymbol(item.symbol || '')
    setModal(true)
  }

  const handleSubmit = () => {
    if (!inputTitle.trim()) { toast.error('Title is required'); return }
    if (isCurrencyTab && !inputCode.trim()) { toast.error('Currency code is required'); return }

    const payload = {
      title: inputTitle.trim(),
      code: inputCode.trim().toUpperCase(),
      symbol: inputSymbol.trim(),
    }

    if (editItem) {
      updateMutation.mutate({ id: editItem._id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">Categories</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage job categories, types, career levels, education & currencies</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={15} /> Add {activeTabSingular}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
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
        <EmptyState icon={Tag} title={`No ${activeTabLabel.toLowerCase()} yet`}
          action={<button onClick={openCreate} className="btn-primary btn-sm"><Plus size={13} /> Add First</button>} />
      ) : (
        <div className="card overflow-hidden">
          <Table headers={isCurrencyTab ? ['Title', 'Code', 'Symbol', 'Actions'] : ['Title', 'Slug / ID', 'Actions']}>
            {items.map(item => (
              <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
                <td className="py-3.5 px-4">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {item.catTitle || item.title}
                  </p>
                </td>
                {isCurrencyTab ? (
                  <>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-300">{item.code}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{item.symbol}</span>
                    </td>
                  </>
                ) : (
                  <td className="py-3.5 px-4">
                    <span className="text-xs text-gray-400 font-mono">{item.slug || item._id}</span>
                  </td>
                )}
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
        title={editItem ? `Edit ${activeTabSingular}` : `Add ${activeTabSingular}`}
        size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              value={inputTitle}
              onChange={e => setInputTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isCurrencyTab && handleSubmit()}
              placeholder={
                activeTab === 'categories' ? 'e.g. Information Technology' :
                isCurrencyTab ? 'e.g. US Dollar' : 'e.g. Full Time'
              }
              className="input"
              autoFocus
            />
          </div>

          {isCurrencyTab && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Code *</label>
                <input
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g. USD"
                  maxLength={5}
                  className="input uppercase"
                />
              </div>
              <div>
                <label className="label">Symbol</label>
                <input
                  value={inputSymbol}
                  onChange={e => setInputSymbol(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g. $"
                  className="input"
                />
              </div>
            </div>
          )}

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