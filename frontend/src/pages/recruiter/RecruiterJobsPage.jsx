import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { updateApplicationStatus } from '../../api/applicationsApi.js'
import { listMyCompanies } from '../../api/companyApi.js'
import { listMyJobs, createJob, updateJob, deleteJob } from '../../api/jobsApi.js'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { formatSalaryRange } from '../../utils/formatSalary.js'
import { Button } from '../../components/ui/index.js'
import { ApplicantsPipelinePanel } from '../../features/recruiter/ApplicantsPipelinePanel.jsx'
import {
  JOB_DEFAULTS,
  jobSchema,
  toDatetimeLocalValue,
  entityId,
} from '../../features/recruiter/recruiterSchemas.js'

export function RecruiterJobsPage() {
  const queryClient = useQueryClient()
  const [editingJobId, setEditingJobId] = useState(null)
  const [pipelineJobId, setPipelineJobId] = useState(null)

  const jobForm = useForm({
    defaultValues: JOB_DEFAULTS,
    resolver: zodResolver(jobSchema),
  })

  const companiesQuery = useQuery({
    queryKey: queryKeys.recruiter.companies(),
    queryFn: () => listMyCompanies(),
  })

  const jobsQuery = useQuery({
    queryKey: queryKeys.recruiter.jobs(),
    queryFn: () => listMyJobs(),
  })

  const createJobMutation = useMutation({
    mutationFn: (payload) => createJob(payload),
    onSuccess: async (result) => {
      jobForm.reset(JOB_DEFAULTS)
      const createdJob = result?.job
      if (createdJob) {
        queryClient.setQueryData(queryKeys.recruiter.jobs(), (old) => {
          const list = Array.isArray(old) ? old : []
          const jid = entityId(createdJob)
          const exists = list.some((j) => entityId(j) === jid)
          if (exists) return list
          return [createdJob, ...list]
        })
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.jobs() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.analytics() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.analyticsTrend() })
      await queryClient.invalidateQueries({ queryKey: ['jobs', 'list'] })
      toast.success('Job posted successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not post job.'))
    },
  })

  const updateJobMutation = useMutation({
    mutationFn: ({ id, payload }) => updateJob(id, payload),
    onSuccess: async (result) => {
      jobForm.reset(JOB_DEFAULTS)
      setEditingJobId(null)
      const updated = result?.job
      if (updated && entityId(updated)) {
        const jid = entityId(updated)
        queryClient.setQueryData(queryKeys.recruiter.jobs(), (old) => {
          const list = Array.isArray(old) ? old : []
          return list.map((j) => (entityId(j) === jid ? { ...j, ...updated } : j))
        })
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.jobs() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.analytics() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.analyticsTrend() })
      await queryClient.invalidateQueries({ queryKey: ['jobs', 'list'] })
      toast.success('Job updated successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not update job.'))
    },
  })

  const deleteJobMutation = useMutation({
    mutationFn: (id) => deleteJob(id),
    onSuccess: async (_result, deletedId) => {
      queryClient.setQueryData(queryKeys.recruiter.jobs(), (old) => {
        const list = Array.isArray(old) ? old : []
        return list.filter((j) => entityId(j) !== String(deletedId))
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.jobs() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.analytics() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.analyticsTrend() })
      await queryClient.invalidateQueries({ queryKey: ['jobs', 'list'] })
      toast.success('Job deleted successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not delete job.'))
    },
  })

  const updateApplicationMutation = useMutation({
    mutationFn: ({ applicationId, status }) => updateApplicationStatus(String(applicationId), status),
    onMutate: async (variables) => {
      const { applicationId, status, jobId } = variables
      const jKey = String(jobId)
      const aKey = String(applicationId)
      await queryClient.cancelQueries({ queryKey: ['recruiter', 'job-applications', jKey] })
      const snapshots = queryClient.getQueriesData({ queryKey: ['recruiter', 'job-applications', jKey] })
      queryClient.setQueriesData({ queryKey: ['recruiter', 'job-applications', jKey] }, (old) => {
        if (!Array.isArray(old)) return old
        return old.map((a) => (String(a._id) === aKey ? { ...a, status } : a))
      })
      queryClient.setQueryData(queryKeys.recruiter.applicationDetail(aKey), (old) =>
        old && String(old._id) === aKey ? { ...old, status } : old,
      )
      return { snapshots }
    },
    onError: (error, _variables, context) => {
      context?.snapshots?.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
      toast.error(getApiErrorMessage(error, 'Could not update application status.'))
    },
    onSuccess: () => {
      toast.success('Application status updated.')
    },
    onSettled: (_data, _err, variables) => {
      const jKey = String(variables.jobId)
      const aKey = String(variables.applicationId)
      void queryClient.invalidateQueries({ queryKey: ['recruiter', 'job-applications', jKey] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.applicationDetail(aKey) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.jobs() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.analytics() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.analyticsTrend() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.upcomingInterviews() })
    },
  })

  const startEditing = (job) => {
    const jid = entityId(job)
    setEditingJobId(jid)
    jobForm.reset({
      title: job.title,
      description: job.description,
      location: job.location,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      minSalary: job.minSalary,
      maxSalary: job.maxSalary,
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
      companyId: entityId(job.company) || '',
      isDraft: Boolean(job.isDraft),
      expiresAt: toDatetimeLocalValue(job.expiresAt),
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
    const expiresRaw = (values.expiresAt || '').trim()
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
      isDraft: Boolean(values.isDraft),
      expiresAt: expiresRaw ? new Date(expiresRaw).toISOString() : null,
    }

    if (editingJobId) {
      updateJobMutation.mutate({ id: editingJobId, payload })
    } else {
      createJobMutation.mutate(payload)
    }
  }

  const isJobSubmitting = createJobMutation.isPending || updateJobMutation.isPending
  const companies = companiesQuery.data || []
  const jobs = useMemo(() => jobsQuery.data || [], [jobsQuery.data])

  useEffect(() => {
    if (jobs.length === 0) {
      setPipelineJobId(null)
      return
    }
    const active = jobs.filter((j) => j.isActive !== false)
    const pool = active.length > 0 ? active : jobs
    setPipelineJobId((current) => {
      if (current && pool.some((j) => entityId(j) === current)) return current
      return entityId(pool[0])
    })
  }, [jobs])

  const selectedJob = pipelineJobId ? jobs.find((j) => entityId(j) === pipelineJobId) : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jobs & applicants</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Post roles, edit listings, and move candidates through your pipeline.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingJobId ? 'Edit job' : 'Post a job'}
          </h2>
          {editingJobId && (
            <button
              type="button"
              onClick={cancelEditing}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Cancel editing
            </button>
          )}
        </div>
        <form className="mt-4 grid gap-4 lg:grid-cols-2" onSubmit={jobForm.handleSubmit(handleJobSubmit)}>
          <div className="lg:col-span-2">
            <label htmlFor="rj-title" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Job title
            </label>
            <input
              {...jobForm.register('title')}
              id="rj-title"
              placeholder="Frontend Developer"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            />
            {jobForm.formState.errors.title && (
              <p className="mt-1.5 text-sm text-red-600">{jobForm.formState.errors.title.message}</p>
            )}
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="rj-desc" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              {...jobForm.register('description')}
              id="rj-desc"
              rows={4}
              placeholder="Describe the role…"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            />
            {jobForm.formState.errors.description && (
              <p className="mt-1.5 text-sm text-red-600">{jobForm.formState.errors.description.message}</p>
            )}
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="rj-loc" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Location
            </label>
            <input
              {...jobForm.register('location')}
              id="rj-loc"
              placeholder="Remote / Hyderabad, IN"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            />
            {jobForm.formState.errors.location && (
              <p className="mt-1.5 text-sm text-red-600">{jobForm.formState.errors.location.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="rj-emp" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Employment type
            </label>
            <select
              {...jobForm.register('employmentType')}
              id="rj-emp"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          <div>
            <label htmlFor="rj-exp" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Experience level
            </label>
            <select
              {...jobForm.register('experienceLevel')}
              id="rj-exp"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            >
              <option value="fresher">Fresher</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </select>
          </div>
          <div>
            <label htmlFor="rj-min" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Min salary (₹ / year)
            </label>
            <input
              {...jobForm.register('minSalary')}
              id="rj-min"
              type="number"
              min="0"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="rj-max" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Max salary (₹ / year)
            </label>
            <input
              {...jobForm.register('maxSalary')}
              id="rj-max"
              type="number"
              min="0"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="rj-skills" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Skills (comma separated)
            </label>
            <input
              {...jobForm.register('skills')}
              id="rj-skills"
              placeholder="React, Node.js…"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="rj-co" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Company
            </label>
            <select
              {...jobForm.register('companyId')}
              id="rj-co"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            >
              <option value="">Select company</option>
              {companies.map((c) => (
                <option key={entityId(c)} value={entityId(c)}>
                  {c.name}
                </option>
              ))}
            </select>
            {jobForm.formState.errors.companyId && (
              <p className="mt-1.5 text-sm text-red-600">{jobForm.formState.errors.companyId.message}</p>
            )}
            {companies.length === 0 && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                Add a company under{' '}
                <Link to="/recruiter/companies" className="font-semibold underline">
                  Companies
                </Link>{' '}
                first.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 lg:col-span-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" {...jobForm.register('isDraft')} className="h-4 w-4 rounded accent-indigo-600" />
              Save as draft (hidden from public listings)
            </label>
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="rj-expires" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Listing expiry (optional)
            </label>
            <input
              {...jobForm.register('expiresAt')}
              id="rj-expires"
              type="datetime-local"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            />
          </div>
          <div className="lg:col-span-2">
            <Button type="submit" disabled={isJobSubmitting || companiesQuery.isLoading}>
              {isJobSubmitting ? 'Saving…' : editingJobId ? 'Update job' : 'Post job'}
            </Button>
          </div>
        </form>
      </div>

      <div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your postings</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Pick a role to manage its pipeline — one workspace, full width.
            </p>
          </div>
          {jobs.length > 0 && (
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {jobs.length} {jobs.length === 1 ? 'listing' : 'listings'}
            </p>
          )}
        </div>
        {jobsQuery.isLoading && <p className="mt-3 text-sm text-gray-500">Loading jobs…</p>}

        {jobs.length === 0 && !jobsQuery.isLoading && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No jobs posted yet.</p>
        )}

        {jobs.length > 0 && (
          <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,20rem)_1fr] lg:items-start lg:gap-8">
            <div className="space-y-3 lg:max-h-[calc(100dvh-9rem)] lg:overflow-y-auto lg:pr-1">
              {jobs.map((job) => {
                const jid = entityId(job)
                const isSelected = pipelineJobId === jid
                const isInactive = job.isActive === false
                return (
                  <div
                    key={jid}
                    className={`rounded-2xl border transition-shadow ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/25 dark:bg-indigo-950/30 dark:ring-indigo-400/30'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600'
                    } ${isInactive ? 'opacity-80' : ''}`}
                  >
                    <div className="flex gap-2 p-4">
                      <button
                        type="button"
                        onClick={() => setPipelineJobId(jid)}
                        className="min-w-0 flex-1 rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <p className="font-semibold text-gray-900 dark:text-white">{job.title}</p>
                        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                          <span className="truncate">{job.company?.name}</span>
                          <span className="text-gray-400"> · </span>
                          <span className="truncate">{job.location}</span>
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {isInactive && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:bg-red-950/60 dark:text-red-300">
                              Deactivated
                            </span>
                          )}
                          {job.isDraft && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                              Draft
                            </span>
                          )}
                          {job.expiresAt &&
                            new Date(job.expiresAt) <= new Date() &&
                            job.isActive !== false && (
                              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                Expired
                              </span>
                            )}
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {job.employmentType} · {job.experienceLevel}
                          {job.minSalary || job.maxSalary
                            ? ` · ${formatSalaryRange(job.minSalary, job.maxSalary)}`
                            : ''}
                        </p>
                      </button>
                      <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-start">
                        <button
                          type="button"
                          onClick={() => startEditing(job)}
                          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deleteJobMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Delete "${job.title}"? This will deactivate the listing.`)) {
                              deleteJobMutation.mutate(jid)
                            }
                          }}
                          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:hover:bg-red-950/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="min-w-0 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
              {selectedJob && selectedJob.isActive !== false && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="border-b border-gray-100 pb-4 dark:border-gray-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                      Pipeline
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{selectedJob.title}</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {selectedJob.company?.name} · {selectedJob.location}
                    </p>
                  </div>
                  <ApplicantsPipelinePanel
                    jobId={pipelineJobId}
                    onStatusChange={(applicationId, status) =>
                      updateApplicationMutation.mutateAsync({
                        applicationId: String(applicationId),
                        status,
                        jobId: String(pipelineJobId),
                      })
                    }
                    isStatusPendingFor={(applicationId) =>
                      updateApplicationMutation.isPending &&
                      String(updateApplicationMutation.variables?.applicationId) === String(applicationId)
                    }
                  />
                </div>
              )}

              {selectedJob && selectedJob.isActive === false && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/80 px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900/60">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Listing deactivated</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600 dark:text-gray-400">
                    The applicant pipeline is hidden for deactivated jobs. Edit the job to publish again if you need
                    to manage candidates.
                  </p>
                </div>
              )}

              {!selectedJob && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Select a job to view applicants.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
