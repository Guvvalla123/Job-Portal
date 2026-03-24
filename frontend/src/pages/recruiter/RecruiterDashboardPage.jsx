import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { apiClient } from '../../api/apiClient.js'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { formatSalaryRange } from '../../utils/formatSalary.js'
import { openApplicationResumeInNewTab } from '../../lib/openApplicationResumeTab.js'

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  website: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
})

const jobSchema = z
  .object({
    title: z.string().min(3, 'Job title must be at least 3 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters (API requirement)'),
    location: z.string().min(2, 'Location must be at least 2 characters'),
    employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship']),
    experienceLevel: z.enum(['fresher', 'junior', 'mid', 'senior', 'lead']),
    minSalary: z.coerce.number().min(0, 'Min salary must be 0 or more'),
    maxSalary: z.coerce.number().min(0, 'Max salary must be 0 or more'),
    skills: z.string().optional(),
    companyId: z.string().min(1, 'Please select a company'),
  })
  .refine((d) => d.maxSalary >= d.minSalary, {
    message: 'Max salary must be greater than or equal to min salary',
    path: ['maxSalary'],
  })

const JOB_DEFAULTS = {
  title: '',
  description: '',
  location: '',
  employmentType: 'full-time',
  experienceLevel: 'junior',
  minSalary: 0,
  maxSalary: 0,
  skills: '',
  companyId: '',
}

const STATUS_BADGE = {
  applied: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  shortlisted: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  rejected: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  hired: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
}

export function RecruiterDashboardPage() {
  const queryClient = useQueryClient()
  const [editingJobId, setEditingJobId] = useState(null)

  const companyForm = useForm({
    defaultValues: { name: '', website: '', location: '', description: '' },
    resolver: zodResolver(companySchema),
  })

  const jobForm = useForm({
    defaultValues: JOB_DEFAULTS,
    resolver: zodResolver(jobSchema),
  })

  const companiesQuery = useQuery({
    queryKey: queryKeys.recruiter.companies(),
    queryFn: async () => {
      const response = await apiClient.get('/companies/me')
      return response.data.data.companies
    },
  })

  const jobsQuery = useQuery({
    queryKey: queryKeys.recruiter.jobs(),
    queryFn: async () => {
      const response = await apiClient.get('/jobs/me')
      return response.data.data.jobs
    },
  })

  const analyticsQuery = useQuery({
    queryKey: queryKeys.recruiter.analytics(),
    queryFn: async () => {
      const response = await apiClient.get('/jobs/analytics')
      return response.data.data
    },
  })

  const createCompanyMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/companies', payload),
    onSuccess: async (response) => {
      companyForm.reset()
      const created = response.data?.data?.company
      if (created) {
        queryClient.setQueryData(queryKeys.recruiter.companies(), (old) => {
          const list = Array.isArray(old) ? old : []
          const exists = list.some((c) => c._id === created._id)
          if (exists) return list
          return [created, ...list]
        })
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.companies() })
      await queryClient.invalidateQueries({ queryKey: ['companies', 'list'] })
      toast.success(response.data?.message || 'Company created successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not create company.'))
    },
  })

  const createJobMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/jobs', payload),
    onSuccess: async (response) => {
      jobForm.reset(JOB_DEFAULTS)
      const createdJob = response.data?.data?.job
      if (createdJob) {
        queryClient.setQueryData(queryKeys.recruiter.jobs(), (old) => {
          const list = Array.isArray(old) ? old : []
          const exists = list.some((j) => j._id === createdJob._id)
          if (exists) return list
          return [createdJob, ...list]
        })
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.jobs() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.analytics() })
      await queryClient.invalidateQueries({ queryKey: ['jobs', 'list'] })
      toast.success(response.data?.message || 'Job posted successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not post job.'))
    },
  })

  const updateJobMutation = useMutation({
    mutationFn: ({ id, payload }) => apiClient.put(`/jobs/${id}`, payload),
    onSuccess: async (response) => {
      jobForm.reset(JOB_DEFAULTS)
      setEditingJobId(null)
      const updated = response.data?.data?.job
      if (updated?._id) {
        queryClient.setQueryData(queryKeys.recruiter.jobs(), (old) => {
          const list = Array.isArray(old) ? old : []
          return list.map((j) => (j._id === updated._id ? { ...j, ...updated } : j))
        })
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.jobs() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.analytics() })
      await queryClient.invalidateQueries({ queryKey: ['jobs', 'list'] })
      toast.success(response.data?.message || 'Job updated successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not update job.'))
    },
  })

  const deleteJobMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/jobs/${id}`),
    onSuccess: async (response, deletedId) => {
      queryClient.setQueryData(queryKeys.recruiter.jobs(), (old) => {
        const list = Array.isArray(old) ? old : []
        return list.filter((j) => j._id !== deletedId)
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.jobs() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.analytics() })
      await queryClient.invalidateQueries({ queryKey: ['jobs', 'list'] })
      toast.success(response.data?.message || 'Job deleted successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not delete job.'))
    },
  })

  const updateApplicationMutation = useMutation({
    mutationFn: ({ applicationId, status, jobId }) =>
      apiClient.patch(`/applications/${String(applicationId)}/status`, { status }),
    onSuccess: (response, variables) => {
      const { applicationId, status, jobId } = variables
      const jKey = String(jobId)
      const aKey = String(applicationId)
      const serverApp = response?.data?.data?.application

      queryClient.setQueryData(queryKeys.recruiter.jobApplications(jKey), (old) => {
        if (!Array.isArray(old)) return old
        return old.map((a) =>
          String(a._id) === aKey ? { ...a, status: serverApp?.status ?? status } : a,
        )
      })

      void queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.jobApplications(jKey) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.jobs() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.analytics() })

      toast.success(response.data?.message || 'Application status updated.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not update application status.'))
    },
  })

  const startEditing = (job) => {
    setEditingJobId(job._id)
    jobForm.reset({
      title: job.title,
      description: job.description,
      location: job.location,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      minSalary: job.minSalary,
      maxSalary: job.maxSalary,
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
      companyId: job.company?._id || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEditing = () => {
    setEditingJobId(null)
    jobForm.reset(JOB_DEFAULTS)
  }

  const handleJobSubmit = (values) => {
    const minSalary = Number.isFinite(Number(values.minSalary)) ? Number(values.minSalary) : 0
    const maxSalary = Number.isFinite(Number(values.maxSalary)) ? Number(values.maxSalary) : 0
    const payload = {
      title: values.title,
      description: values.description,
      location: values.location,
      employmentType: values.employmentType,
      experienceLevel: values.experienceLevel,
      minSalary,
      maxSalary,
      skills: (values.skills || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      companyId: values.companyId,
    }

    if (editingJobId) {
      updateJobMutation.mutate({ id: editingJobId, payload })
    } else {
      createJobMutation.mutate(payload)
    }
  }

  const isJobSubmitting = createJobMutation.isPending || updateJobMutation.isPending

  const analytics = analyticsQuery.data || {}

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-6 shadow-lg sm:px-8">
        <h1 className="text-xl font-semibold text-white sm:text-2xl">Recruiter Dashboard</h1>
        <p className="mt-1 text-sm text-indigo-100">Create company profiles, post & manage jobs.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalJobs ?? '—'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Applications</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalApplications ?? '—'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Shortlisted</p>
              <p className="text-2xl font-bold text-amber-600">{analytics.byStatus?.shortlisted ?? '—'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Hired</p>
              <p className="text-2xl font-bold text-emerald-600">{analytics.byStatus?.hired ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Company form */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="border-l-4 border-indigo-600 pl-4 text-lg font-semibold text-gray-900">Create Company</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={companyForm.handleSubmit((v) => createCompanyMutation.mutate(v))}
          >
            <div>
              <label htmlFor="rc-companyName" className="mb-1.5 block text-sm font-medium text-gray-700">Company name</label>
              <input {...companyForm.register('name')} id="rc-companyName" placeholder="Acme Inc." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              {companyForm.formState.errors.name && <p className="mt-1.5 text-sm text-red-600">{companyForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="rc-companyWebsite" className="mb-1.5 block text-sm font-medium text-gray-700">Website</label>
              <input {...companyForm.register('website')} id="rc-companyWebsite" placeholder="https://example.com" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="rc-companyLocation" className="mb-1.5 block text-sm font-medium text-gray-700">Location</label>
              <input {...companyForm.register('location')} id="rc-companyLocation" placeholder="New York, NY" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="rc-companyDescription" className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <textarea {...companyForm.register('description')} id="rc-companyDescription" placeholder="About the company..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={createCompanyMutation.isPending} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60">
              {createCompanyMutation.isPending ? 'Creating...' : 'Create Company'}
            </button>
          </form>
        </div>

        {/* Job form (create or edit) */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="border-l-4 border-indigo-600 pl-4 text-lg font-semibold text-gray-900">
              {editingJobId ? 'Edit Job' : 'Post Job'}
            </h2>
            {editingJobId && (
              <button type="button" onClick={cancelEditing} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Cancel editing
              </button>
            )}
          </div>
          <form className="mt-4 space-y-3" onSubmit={jobForm.handleSubmit(handleJobSubmit)}>
            <div>
              <label htmlFor="rc-jobTitle" className="mb-1.5 block text-sm font-medium text-gray-700">Job title</label>
              <input {...jobForm.register('title')} id="rc-jobTitle" placeholder="Frontend Developer" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              {jobForm.formState.errors.title && <p className="mt-1.5 text-sm text-red-600">{jobForm.formState.errors.title.message}</p>}
            </div>
            <div>
              <label htmlFor="rc-jobDescription" className="mb-1.5 block text-sm font-medium text-gray-700">Job description</label>
              <textarea {...jobForm.register('description')} id="rc-jobDescription" rows={3} placeholder="Describe the role..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              {jobForm.formState.errors.description && <p className="mt-1.5 text-sm text-red-600">{jobForm.formState.errors.description.message}</p>}
            </div>
            <div>
              <label htmlFor="rc-jobLocation" className="mb-1.5 block text-sm font-medium text-gray-700">Location</label>
              <input {...jobForm.register('location')} id="rc-jobLocation" placeholder="Remote / San Francisco, CA" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              {jobForm.formState.errors.location && <p className="mt-1.5 text-sm text-red-600">{jobForm.formState.errors.location.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="rc-employmentType" className="mb-1.5 block text-sm font-medium text-gray-700">Employment type</label>
                <select {...jobForm.register('employmentType')} id="rc-employmentType" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label htmlFor="rc-experienceLevel" className="mb-1.5 block text-sm font-medium text-gray-700">Experience level</label>
                <select {...jobForm.register('experienceLevel')} id="rc-experienceLevel" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  <option value="fresher">Fresher</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="rc-minSalary" className="mb-1.5 block text-sm font-medium text-gray-700">Min salary (₹ / year)</label>
                <input {...jobForm.register('minSalary')} id="rc-minSalary" type="number" min="0" placeholder="0" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="rc-maxSalary" className="mb-1.5 block text-sm font-medium text-gray-700">Max salary (₹ / year)</label>
                <input {...jobForm.register('maxSalary')} id="rc-maxSalary" type="number" min="0" placeholder="0" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label htmlFor="rc-skills" className="mb-1.5 block text-sm font-medium text-gray-700">Skills (comma separated)</label>
              <input {...jobForm.register('skills')} id="rc-skills" placeholder="React, Node.js, MongoDB" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="rc-companyId" className="mb-1.5 block text-sm font-medium text-gray-700">Company</label>
              <select {...jobForm.register('companyId')} id="rc-companyId" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="">Select company</option>
                {(companiesQuery.data || []).map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              {jobForm.formState.errors.companyId && <p className="mt-1.5 text-sm text-red-600">{jobForm.formState.errors.companyId.message}</p>}
            </div>
            <button type="submit" disabled={isJobSubmitting || companiesQuery.isLoading} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60">
              {isJobSubmitting ? 'Saving...' : editingJobId ? 'Update Job' : 'Post Job'}
            </button>
          </form>
        </div>
      </div>

      {/* My companies */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="border-l-4 border-indigo-600 pl-4 text-lg font-semibold text-gray-900">My Companies</h2>
        {companiesQuery.isLoading && <p className="mt-3 text-sm text-gray-500">Loading companies...</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(companiesQuery.data || []).map((company) => (
            <div key={company._id} className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-100">
              <p className="font-medium text-gray-900">{company.name}</p>
              <p className="text-sm text-gray-500">{company.location || 'No location'}</p>
              {company.website && (
                <a href={company.website} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  {company.website}
                </a>
              )}
            </div>
          ))}
          {companiesQuery.data?.length === 0 && <p className="text-sm text-gray-500">No companies yet. Create one above.</p>}
        </div>
      </div>

      {/* My posted jobs */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="border-l-4 border-indigo-600 pl-4 text-lg font-semibold text-gray-900">My Posted Jobs</h2>
        {jobsQuery.isLoading && <p className="mt-3 text-sm text-gray-500">Loading jobs...</p>}
        <div className="mt-4 space-y-4">
          {(jobsQuery.data || []).map((job) => (
            <div key={job._id} className={`rounded-xl border-l-4 p-5 shadow-sm ring-1 ${job.isActive === false ? 'border-red-400 bg-red-50/50 ring-red-100' : 'border-indigo-500 bg-white ring-gray-100'}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-600">
                    {job.company?.name} &middot; {job.location}
                    {job.isActive === false && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Deactivated</span>}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {job.employmentType} &middot; {job.experienceLevel}
                    {job.minSalary || job.maxSalary ? ` · ${formatSalaryRange(job.minSalary, job.maxSalary)}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(job)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={deleteJobMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete "${job.title}"? This will deactivate the listing.`)) {
                        deleteJobMutation.mutate(job._id)
                      }
                    }}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {job.isActive !== false && (
                <ApplicantsPanel
                  jobId={job._id}
                  onStatusChange={(applicationId, status) =>
                    updateApplicationMutation.mutateAsync({
                      applicationId: String(applicationId),
                      status,
                      jobId: String(job._id),
                    })
                  }
                  isStatusPendingFor={(applicationId) =>
                    updateApplicationMutation.isPending &&
                    String(updateApplicationMutation.variables?.applicationId) === String(applicationId)
                  }
                />
              )}
            </div>
          ))}
          {jobsQuery.data?.length === 0 && <p className="text-sm text-gray-500">No jobs posted yet.</p>}
        </div>
      </div>
    </section>
  )
}

function ApplicantsPanel({ jobId, onStatusChange, isStatusPendingFor }) {
  const [openingResumeId, setOpeningResumeId] = useState(null)
  const jobKey = String(jobId)

  const applicationsQuery = useQuery({
    queryKey: queryKeys.recruiter.jobApplications(jobKey),
    queryFn: async () => {
      const response = await apiClient.get(`/applications/job/${jobKey}`)
      return response.data.data.applications
    },
  })

  return (
    <div className="mt-4 rounded-lg bg-indigo-50/50 p-4 ring-1 ring-indigo-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Applicants</p>
      {applicationsQuery.isLoading && <p className="mt-2 text-sm text-gray-500">Loading applicants...</p>}
      {applicationsQuery.isError && <p className="mt-2 text-sm text-red-600">Could not load applicants.</p>}
      <div className="mt-3 space-y-2">
        {(applicationsQuery.data || []).map((app) => (
          <div key={app._id} className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              {app.candidate?.profileImageUrl && (
                <img src={app.candidate.profileImageUrl} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-100" loading="lazy" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{app.candidate?.fullName}</p>
                <p className="text-xs text-gray-500">{app.candidate?.email}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[app.status] || 'bg-gray-100 text-gray-700'}`}>
                {app.status}
              </span>
              {app.candidate?.resumeUrl && (
                <button
                  type="button"
                  disabled={openingResumeId === String(app._id)}
                  onClick={async () => {
                    const id = String(app._id ?? '')
                    setOpeningResumeId(id)
                    try {
                      await openApplicationResumeInNewTab(id)
                    } finally {
                      setOpeningResumeId(null)
                    }
                  }}
                  className="rounded-lg border border-indigo-200 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-60"
                >
                  {openingResumeId === String(app._id) ? 'Opening…' : 'View Resume'}
                </button>
              )}
            </div>
            {app.coverLetter && (
              <p className="mt-2 rounded-md bg-gray-50 p-2.5 text-xs text-gray-600">{app.coverLetter}</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <label htmlFor={`status-${app._id}`} className="text-xs font-medium text-gray-600">Status:</label>
              <select
                id={`status-${app._id}`}
                value={app.status}
                disabled={isStatusPendingFor?.(app._id)}
                onChange={async (e) => {
                  const next = e.target.value
                  try {
                    await onStatusChange(app._id, next)
                  } catch {
                    /* toast + rollback: mutation onError; revert select via refetch from cache */
                  }
                }}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
            </div>
          </div>
        ))}
        {applicationsQuery.data?.length === 0 && <p className="text-xs text-gray-500">No applicants yet.</p>}
      </div>
    </div>
  )
}
