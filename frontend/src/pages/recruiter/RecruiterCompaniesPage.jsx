import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  listMyCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  uploadCompanyLogo,
} from '../../api/companyApi.js'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { Modal, Button } from '../../components/ui/index.js'
import { companySchema, entityId } from '../../features/recruiter/recruiterSchemas.js'

export function RecruiterCompaniesPage() {
  const queryClient = useQueryClient()
  const [companyEditModal, setCompanyEditModal] = useState(null)
  const [companyModalDraft, setCompanyModalDraft] = useState({
    name: '',
    website: '',
    location: '',
    description: '',
  })

  useEffect(() => {
    if (!companyEditModal) return
    setCompanyModalDraft({
      name: companyEditModal.name || '',
      website: companyEditModal.website || '',
      location: companyEditModal.location || '',
      description: companyEditModal.description || '',
    })
  }, [companyEditModal])

  const companyForm = useForm({
    defaultValues: { name: '', website: '', location: '', description: '' },
    resolver: zodResolver(companySchema),
  })

  const companiesQuery = useQuery({
    queryKey: queryKeys.recruiter.companies(),
    queryFn: () => listMyCompanies(),
  })

  const createCompanyMutation = useMutation({
    mutationFn: (payload) => createCompany(payload),
    onSuccess: async (result) => {
      companyForm.reset()
      const created = result?.company
      if (created) {
        queryClient.setQueryData(queryKeys.recruiter.companies(), (old) => {
          const list = Array.isArray(old) ? old : []
          const cid = entityId(created)
          const exists = list.some((c) => entityId(c) === cid)
          if (exists) return list
          return [created, ...list]
        })
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.companies() })
      await queryClient.invalidateQueries({ queryKey: ['companies', 'list'] })
      toast.success('Company created successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not create company.'))
    },
  })

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCompany(id, payload),
    onSuccess: async (result) => {
      const updated = result?.company
      if (updated && entityId(updated)) {
        const uid = entityId(updated)
        queryClient.setQueryData(queryKeys.recruiter.companies(), (old) => {
          const list = Array.isArray(old) ? old : []
          return list.map((c) => (entityId(c) === uid ? { ...c, ...updated } : c))
        })
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.companies() })
      await queryClient.invalidateQueries({ queryKey: ['companies', 'list'] })
      setCompanyEditModal(null)
      toast.success('Company updated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update company.')),
  })

  const deleteCompanyMutation = useMutation({
    mutationFn: (id) => deleteCompany(id),
    onSuccess: async (_result, deletedId) => {
      queryClient.setQueryData(queryKeys.recruiter.companies(), (old) => {
        const list = Array.isArray(old) ? old : []
        return list.filter((c) => entityId(c) !== String(deletedId))
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.companies() })
      await queryClient.invalidateQueries({ queryKey: ['companies', 'list'] })
      setCompanyEditModal(null)
      toast.success('Company deleted.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not delete company.')),
  })

  const uploadCompanyLogoMutation = useMutation({
    mutationFn: ({ id, file }) => uploadCompanyLogo(id, file),
    onSuccess: async (result) => {
      const updated = result?.company
      if (updated && entityId(updated)) {
        const uid = entityId(updated)
        queryClient.setQueryData(queryKeys.recruiter.companies(), (old) => {
          const list = Array.isArray(old) ? old : []
          return list.map((c) => (entityId(c) === uid ? { ...c, ...updated } : c))
        })
        setCompanyEditModal((prev) =>
          prev && entityId(prev) === uid ? { ...prev, ...updated } : prev,
        )
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.companies() })
      toast.success('Logo updated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Logo upload failed.')),
  })

  const companies = companiesQuery.data || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Companies</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Brands candidates see on your job posts. Add at least one before posting roles.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add company</h2>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={companyForm.handleSubmit((v) => createCompanyMutation.mutate(v))}
        >
          <div className="sm:col-span-2">
            <label htmlFor="rc2-companyName" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Company name
            </label>
            <input
              {...companyForm.register('name')}
              id="rc2-companyName"
              placeholder="Acme Inc."
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            />
            {companyForm.formState.errors.name && (
              <p className="mt-1.5 text-sm text-red-600">{companyForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="rc2-website" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Website
            </label>
            <input
              {...companyForm.register('website')}
              id="rc2-website"
              placeholder="https://example.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="rc2-location" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Location
            </label>
            <input
              {...companyForm.register('location')}
              id="rc2-location"
              placeholder="Hyderabad, IN"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="rc2-desc" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              {...companyForm.register('description')}
              id="rc2-desc"
              rows={3}
              placeholder="What you do, culture, size…"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={createCompanyMutation.isPending}>
              {createCompanyMutation.isPending ? 'Creating…' : 'Create company'}
            </Button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your companies</h2>
        {companiesQuery.isLoading && <p className="mt-3 text-sm text-gray-500">Loading…</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => {
            const cid = entityId(company)
            return (
              <div
                key={cid}
                className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt=""
                    className="mb-3 h-14 w-14 rounded-xl object-cover ring-1 ring-gray-100 dark:ring-gray-700"
                  />
                ) : (
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-teal-100 text-lg font-bold text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                    {company.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                )}
                <p className="font-semibold text-gray-900 dark:text-white">{company.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{company.location || 'No location'}</p>
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 truncate text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
                  >
                    {company.website}
                  </a>
                ) : null}
                <Button type="button" variant="secondary" size="sm" className="mt-4 w-fit" onClick={() => setCompanyEditModal(company)}>
                  Edit
                </Button>
              </div>
            )
          })}
        </div>
        {companies.length === 0 && !companiesQuery.isLoading && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No companies yet. Create one above.</p>
        )}
      </div>

      <Modal
        open={Boolean(companyEditModal)}
        onClose={() => setCompanyEditModal(null)}
        title={companyEditModal ? `Edit: ${companyEditModal.name}` : 'Edit company'}
        size="lg"
      >
        {companyEditModal ? (
          <div className="space-y-4">
            {companyEditModal.logoUrl ? (
              <img
                src={companyEditModal.logoUrl}
                alt=""
                className="h-16 w-16 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-600"
              />
            ) : null}
            <div>
              <label htmlFor="rc2m-name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company name
              </label>
              <input
                id="rc2m-name"
                value={companyModalDraft.name}
                onChange={(e) => setCompanyModalDraft((d) => ({ ...d, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="rc2m-web" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Website
              </label>
              <input
                id="rc2m-web"
                value={companyModalDraft.website}
                onChange={(e) => setCompanyModalDraft((d) => ({ ...d, website: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                placeholder="https://"
              />
            </div>
            <div>
              <label htmlFor="rc2m-loc" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              <input
                id="rc2m-loc"
                value={companyModalDraft.location}
                onChange={(e) => setCompanyModalDraft((d) => ({ ...d, location: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="rc2m-desc" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                id="rc2m-desc"
                value={companyModalDraft.description}
                onChange={(e) => setCompanyModalDraft((d) => ({ ...d, description: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Company logo</span>
              <p className="mb-2 text-xs text-gray-500">JPEG, PNG, or WebP — max 2MB</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="text-sm"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  const cid = entityId(companyEditModal)
                  if (f && cid) uploadCompanyLogoMutation.mutate({ id: cid, file: f })
                  e.target.value = ''
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
              <Button
                type="button"
                disabled={updateCompanyMutation.isPending}
                onClick={() =>
                  updateCompanyMutation.mutate({
                    id: entityId(companyEditModal),
                    payload: {
                      name: companyModalDraft.name,
                      website: companyModalDraft.website || '',
                      location: companyModalDraft.location || '',
                      description: companyModalDraft.description || '',
                    },
                  })
                }
              >
                {updateCompanyMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setCompanyEditModal(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                disabled={deleteCompanyMutation.isPending}
                onClick={() => {
                  if (window.confirm(`Delete company "${companyEditModal.name}"? Active jobs must be removed first.`)) {
                    deleteCompanyMutation.mutate(entityId(companyEditModal))
                  }
                }}
              >
                Delete company
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
