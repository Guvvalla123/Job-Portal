import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createJob as adminCreateJob,
  deleteJob,
  getJobs,
  updateJobStatus,
  verifyJob,
} from '../../api/adminApi.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { CACHE_TIERS } from '../../lib/queryOptions.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage.js'
import { toast } from 'sonner'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { EmptyState, EmptyStateIcons } from '../../components/ui/EmptyState.jsx'

const LIMIT = 15

const CATEGORY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'design', label: 'Design' },
  { value: 'operations', label: 'Operations' },
  { value: 'human-resources', label: 'Human Resources' },
  { value: 'other', label: 'Other' },
]

const EMPLOYMENT_UI_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'remote', label: 'Remote' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
  { value: 'hybrid', label: 'Hybrid' },
]

const EXPERIENCE_OPTIONS = [
  { value: 'fresher', label: 'Fresher' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
]

const CATEGORY_BADGE_VARIANT = {
  technology: 'primary',
  finance: 'success',
  marketing: 'warning',
  sales: 'info',
  design: 'default',
  operations: 'default',
  'human-resources': 'default',
  other: 'default',
}

function addDaysIsoDate(d, days) {
  const x = new Date(d.getTime())
  x.setDate(x.getDate() + days)
  return x.toISOString().slice(0, 10)
}

const numOrZero = z.preprocess((v) => {
  if (v === '' || v == null) return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}, z.number().nonnegative())

const adminCreateJobFormSchema = z
  .object({
    postedByCompanyName: z.string().min(1, 'Company name is required').max(100),
    postedByCompanyLogo: z.string().optional(),
    postedByCompanyWebsite: z.string().optional(),
    applyUrl: z.string().min(1, 'Apply URL is required').url('Enter a valid URL'),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    category: z.string().min(1, 'Select a category'),
    employmentUi: z.string().min(1, 'Select employment type'),
    experienceLevel: z.string().min(1, 'Select experience level'),
    location: z.string().min(2, 'Location is required'),
    minSalary: numOrZero,
    maxSalary: numOrZero,
    skills: z.string().optional(),
    description: z.string().min(20, 'Description must be at least 20 characters').max(10000),
    expiresAt: z.string().optional(),
    markVerified: z.boolean(),
  })
  .superRefine((d, ctx) => {
    const logo = (d.postedByCompanyLogo ?? '').trim()
    if (logo && !z.string().url().safeParse(logo).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['postedByCompanyLogo'],
        message: 'Must be a valid URL',
      })
    }
    const site = (d.postedByCompanyWebsite ?? '').trim()
    if (site && !z.string().url().safeParse(site).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['postedByCompanyWebsite'],
        message: 'Must be a valid URL',
      })
    }
    const min = d.minSalary
    const max = d.maxSalary
    if (min > 0 && max > 0 && max < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxSalary'],
        message: 'Max salary must be ≥ min salary',
      })
    }
  })

function isJobActive(job) {
  return job.isActive !== false
}

function jobStatusKey(job) {
  if (job.isDraft) return 'draft'
  const exp = job.expiresAt ? new Date(job.expiresAt) : null
  if (exp && !Number.isNaN(exp.getTime()) && exp < new Date()) return 'expired'
  if (!isJobActive(job)) return 'inactive'
  return 'active'
}

function buildCreatePayload(values) {
  const minSalary = Number.isFinite(Number(values.minSalary)) ? Number(values.minSalary) : 0
  const maxSalary = Number.isFinite(Number(values.maxSalary)) ? Number(values.maxSalary) : 0
  const skills = (values.skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const ui = values.employmentUi
  let employmentType = ui
  let tags = []
  if (ui === 'remote') {
    employmentType = 'full-time'
    tags = ['remote']
  } else if (ui === 'hybrid') {
    employmentType = 'full-time'
    tags = []
  }

  const logo = (values.postedByCompanyLogo || '').trim()
  const web = (values.postedByCompanyWebsite || '').trim()
  const exp = (values.expiresAt || '').trim()

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    employmentType,
    experienceLevel: values.experienceLevel,
    minSalary,
    maxSalary,
    skills,
    isDraft: false,
    expiresAt: exp ? new Date(`${exp}T23:59:59`).toISOString() : null,
    applyUrl: values.applyUrl.trim(),
    postedByCompanyName: values.postedByCompanyName.trim(),
    postedByCompanyLogo: logo || null,
    postedByCompanyWebsite: web || null,
    category: values.category,
    tags: tags.length ? tags : undefined,
    source: 'manual',
    isVerified: Boolean(values.markVerified),
  }
}

export function AdminJobsPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 360)
  const [tableFilter, setTableFilter] = useState('')
  const debouncedTableFilter = useDebouncedValue(tableFilter, 200)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const createForm = useForm({
    resolver: zodResolver(adminCreateJobFormSchema),
    defaultValues: {
      postedByCompanyName: '',
      postedByCompanyLogo: '',
      postedByCompanyWebsite: '',
      applyUrl: '',
      title: '',
      category: '',
      employmentUi: '',
      experienceLevel: '',
      location: '',
      minSalary: undefined,
      maxSalary: undefined,
      skills: '',
      description: '',
      expiresAt: addDaysIsoDate(new Date(), 7),
      markVerified: true,
    },
  })

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const jobsQuery = useQuery({
    queryKey: queryKeys.admin.jobs(page, debouncedSearch),
    queryFn: () => getJobs(page, LIMIT, debouncedSearch),
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const statusMutation = useMutation({
    mutationFn: ({ jobId, isActive }) => updateJobStatus(jobId, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.jobs() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() })
      toast.success('Job status updated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update job status.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (jobId) => deleteJob(jobId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.jobs() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() })
      toast.success('Job deactivated.')
      setDeleteTarget(null)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not deactivate job.')),
  })

  const verifyMutation = useMutation({
    mutationFn: (jobId) => verifyJob(jobId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.jobs() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() })
      await queryClient.invalidateQueries({ queryKey: ['jobs', 'list'] })
      toast.success('Verification updated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update verification.')),
  })

  const createJobMutation = useMutation({
    mutationFn: async (values) => {
      const payload = buildCreatePayload(values)
      return adminCreateJob(payload)
    },
    onSuccess: async () => {
      toast.success('Job posted!')
      setCreateModalOpen(false)
      createForm.reset({
        postedByCompanyName: '',
        postedByCompanyLogo: '',
        postedByCompanyWebsite: '',
        applyUrl: '',
        title: '',
        category: '',
        employmentUi: '',
        experienceLevel: '',
        location: '',
        minSalary: undefined,
        maxSalary: undefined,
        skills: '',
        description: '',
        expiresAt: addDaysIsoDate(new Date(), 7),
        markVerified: true,
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.jobs() })
      await queryClient.invalidateQueries({ queryKey: ['jobs', 'list'] })
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() })
    },
    onError: () => {
      toast.error('Failed to post job')
    },
  })

  const { jobs = [], pagination = {} } = jobsQuery.data || {}
  const busy = statusMutation.isPending || deleteMutation.isPending || verifyMutation.isPending

  const filteredJobs = useMemo(() => {
    const q = debouncedTableFilter.trim().toLowerCase()
    if (!q) return jobs
    return jobs.filter((job) => {
      const title = (job.title || '').toLowerCase()
      const co = (job.postedByCompanyName || job.company?.name || '').toLowerCase()
      return title.includes(q) || co.includes(q)
    })
  }, [jobs, debouncedTableFilter])

  const openCreateModal = () => {
    createForm.reset({
      postedByCompanyName: '',
      postedByCompanyLogo: '',
      postedByCompanyWebsite: '',
      applyUrl: '',
      title: '',
      category: '',
      employmentUi: '',
      experienceLevel: '',
      location: '',
      minSalary: undefined,
      maxSalary: undefined,
      skills: '',
      description: '',
      expiresAt: addDaysIsoDate(new Date(), 7),
      markVerified: true,
    })
    setCreateModalOpen(true)
  }

  return (
    <section className="space-y-6">
      <div className="min-w-0">
        <Link
          to="/admin/dashboard"
          className="text-sm font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
        >
          ← Admin overview
        </Link>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <PageHeader
            className="min-w-0 flex-1"
            title="Jobs"
            description="Search by title, toggle whether a job is live, verify listings, or post new jobs."
          />
          <Button type="button" variant="primary" size="md" className="shrink-0" onClick={openCreateModal}>
            Post New Job
          </Button>
        </div>
      </div>

      <Card padding="default">
        <Input
          type="search"
          placeholder="Search jobs (API — by title)…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          icon={<EmptyStateIcons.search className="h-5 w-5 text-gray-400" />}
          containerClassName="max-w-md"
          aria-label="Search jobs"
        />
      </Card>

      {jobsQuery.isError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Could not load jobs.
        </p>
      )}

      {jobsQuery.isPending ? (
        <Card padding="default">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : jobs.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={EmptyStateIcons.jobs}
            title="No jobs found"
            description={
              debouncedSearch.trim()
                ? 'Try a different search term.'
                : 'No jobs match the current filters.'
            }
          />
        </Card>
      ) : (
        <Card padding="default" className="overflow-hidden p-0 sm:p-0">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5">
            <Input
              type="search"
              placeholder="Filter this page by title or company…"
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              containerClassName="max-w-md"
              aria-label="Filter jobs table"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                  <th className="px-4 py-3 font-semibold">Job / Company</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Posted</th>
                  <th className="px-4 py-3 font-semibold">Expires</th>
                  <th className="px-4 py-3 font-semibold">Clicks</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const active = isJobActive(job)
                  const status = jobStatusKey(job)
                  const cat = job.category || 'other'
                  const catLabel = CATEGORY_OPTIONS.find((o) => o.value === cat)?.label || cat
                  const catVariant = CATEGORY_BADGE_VARIANT[cat] || 'default'
                  return (
                    <tr
                      key={job._id}
                      className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
                        >
                          {job.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {job.postedByCompanyName || job.company?.name || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={catVariant} size="sm">
                          {catLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{job.location || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {job.expiresAt ? new Date(job.expiresAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-700 dark:text-gray-200">
                        {job.clickCount ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        {status === 'active' && (
                          <Badge variant="success" size="sm">
                            Active
                          </Badge>
                        )}
                        {status === 'expired' && (
                          <Badge variant="danger" size="sm">
                            Expired
                          </Badge>
                        )}
                        {status === 'draft' && (
                          <Badge variant="default" size="sm">
                            Draft
                          </Badge>
                        )}
                        {status === 'inactive' && (
                          <Badge variant="default" size="sm">
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={busy || verifyMutation.isPending}
                            onClick={() => verifyMutation.mutate(job._id)}
                          >
                            {job.isVerified ? 'Unverify' : 'Verify'}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={busy}
                            onClick={() => statusMutation.mutate({ jobId: job._id, isActive: !active })}
                          >
                            {active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            disabled={busy || !active}
                            onClick={() => setDeleteTarget(job)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredJobs.length === 0 && jobs.length > 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No rows match your table filter.
            </p>
          )}
        </Card>
      )}

      {!jobsQuery.isPending && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} jobs)
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page <= 1 || busy}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page >= pagination.totalPages || busy}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={createModalOpen}
        onClose={() => !createJobMutation.isPending && setCreateModalOpen(false)}
        title="Post New Job"
        size="xl"
      >
        <form
          className="space-y-8"
          onSubmit={createForm.handleSubmit((values) => createJobMutation.mutate(values))}
        >
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Company info</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  id="admin-job-company-name"
                  label="Company name *"
                  placeholder="Google"
                  error={createForm.formState.errors.postedByCompanyName?.message}
                  {...createForm.register('postedByCompanyName')}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  id="admin-job-logo"
                  label="Company logo URL (optional)"
                  placeholder="https://logo.clearbit.com/google.com"
                  hint="Tip: logo.clearbit.com/companyname.com gives you instant company logos"
                  error={createForm.formState.errors.postedByCompanyLogo?.message}
                  {...createForm.register('postedByCompanyLogo')}
                />
              </div>
              <Input
                id="admin-job-website"
                label="Company website (optional)"
                placeholder="https://careers.google.com"
                error={createForm.formState.errors.postedByCompanyWebsite?.message}
                {...createForm.register('postedByCompanyWebsite')}
              />
              <div className="sm:col-span-2">
                <Input
                  id="admin-job-apply"
                  label="Apply URL *"
                  placeholder="https://careers.google.com/jobs/123"
                  error={createForm.formState.errors.applyUrl?.message}
                  hint="Paste the exact job URL from the company career page"
                  {...createForm.register('applyUrl')}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-6 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Job details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  id="admin-job-title"
                  label="Job title *"
                  placeholder="Software Engineer"
                  error={createForm.formState.errors.title?.message}
                  {...createForm.register('title')}
                />
              </div>
              <Select
                id="admin-job-category"
                label="Category *"
                placeholder="Select category…"
                options={CATEGORY_OPTIONS}
                error={createForm.formState.errors.category?.message}
                {...createForm.register('category')}
              />
              <Select
                id="admin-job-employment"
                label="Employment type *"
                placeholder="Select type…"
                options={EMPLOYMENT_UI_OPTIONS}
                error={createForm.formState.errors.employmentUi?.message}
                {...createForm.register('employmentUi')}
              />
              <Select
                id="admin-job-exp"
                label="Experience level *"
                placeholder="Select level…"
                options={EXPERIENCE_OPTIONS}
                error={createForm.formState.errors.experienceLevel?.message}
                {...createForm.register('experienceLevel')}
              />
              <Input
                id="admin-job-location"
                label="Location *"
                placeholder="Hyderabad, India"
                error={createForm.formState.errors.location?.message}
                {...createForm.register('location')}
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-6 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Salary</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="admin-job-min-sal"
                label="Min salary (optional)"
                type="number"
                min={0}
                placeholder="500000"
                error={createForm.formState.errors.minSalary?.message}
                {...createForm.register('minSalary')}
              />
              <Input
                id="admin-job-max-sal"
                label="Max salary (optional)"
                type="number"
                min={0}
                placeholder="1000000"
                error={createForm.formState.errors.maxSalary?.message}
                {...createForm.register('maxSalary')}
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-6 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">More details</h3>
            <Input
              id="admin-job-skills"
              label="Skills (optional)"
              placeholder="React, Node.js, MongoDB"
              hint="Separate with commas"
              error={createForm.formState.errors.skills?.message}
              {...createForm.register('skills')}
            />
            <div>
              <label
                htmlFor="admin-job-desc"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Job description *
              </label>
              <textarea
                id="admin-job-desc"
                rows={6}
                placeholder="Describe the role..."
                className="min-h-[8.5rem] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-xs transition-all placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/35 dark:border-slate-600 dark:bg-slate-900/85 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400"
                aria-invalid={createForm.formState.errors.description ? 'true' : undefined}
                {...createForm.register('description')}
              />
              {createForm.formState.errors.description && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                  {createForm.formState.errors.description.message}
                </p>
              )}
            </div>
            <Input
              id="admin-job-expiry"
              label="Expiry date (optional)"
              type="date"
              error={createForm.formState.errors.expiresAt?.message}
              {...createForm.register('expiresAt')}
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 accent-teal-700 dark:border-gray-600"
                checked={!!createForm.watch('markVerified')}
                onChange={(e) =>
                  createForm.setValue('markVerified', e.target.checked, { shouldDirty: true, shouldValidate: true })
                }
              />
              Mark as Verified
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button
              type="button"
              variant="secondary"
              disabled={createJobMutation.isPending}
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createJobMutation.isPending}
              loadingText="Posting..."
            >
              Post Job
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
        title="Deactivate job"
        size="md"
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Deactivate <strong className="text-gray-900 dark:text-white">{deleteTarget?.title}</strong>? It will no
          longer appear in public listings. Applications are kept.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={deleteMutation.isPending}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
          >
            Deactivate job
          </Button>
        </div>
      </Modal>
    </section>
  )
}
