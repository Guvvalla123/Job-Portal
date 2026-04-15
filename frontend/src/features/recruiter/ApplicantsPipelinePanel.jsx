import { memo, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listApplicationsForJob } from '../../api/applicationsApi.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { openApplicationResumeInNewTab } from '../../lib/openApplicationResumeTab.js'
import { ApplicantDetailModal } from './ApplicantDetailModal.jsx'
import { PIPELINE_STATUSES, STATUS_BADGE_CLASSES, STATUS_LABELS } from './applicationPipeline.js'

function PipelineApplicantCardSkeleton() {
  return (
    <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start gap-2">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-[85%] max-w-40" />
          <Skeleton className="h-3 w-[70%] max-w-32" />
        </div>
      </div>
      <Skeleton className="mt-2 h-4 w-16 rounded-full" />
      <div className="mt-2 flex flex-wrap gap-1.5 border-t border-gray-100 pt-2">
        <Skeleton className="h-7 w-14 rounded-md" />
        <Skeleton className="h-7 w-28 rounded-md" />
      </div>
    </div>
  )
}

function ApplicantsPipelineKanbanSkeleton() {
  return (
    <div
      className="mt-4 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6"
      aria-busy="true"
    >
      {PIPELINE_STATUSES.map((st) => (
        <div key={st} className="flex min-h-0 min-w-0 flex-col">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          <div className="flex max-h-64 flex-col gap-2 overflow-hidden pr-0.5 lg:max-h-[min(28rem,55vh)]">
            <PipelineApplicantCardSkeleton />
            <PipelineApplicantCardSkeleton />
          </div>
        </div>
      ))}
    </div>
  )
}

function ApplicantsPipelineListSkeleton() {
  return (
    <div className="mt-4 space-y-2" aria-busy="true">
      <PipelineApplicantCardSkeleton />
      <PipelineApplicantCardSkeleton />
      <PipelineApplicantCardSkeleton />
    </div>
  )
}

const PipelineApplicantCard = memo(function PipelineApplicantCard({
  app,
  openingResumeId,
  setOpeningResumeId,
  onOpenDetail,
  onStatusChange,
  isStatusPendingFor,
}) {
  const c = app.candidate
  return (
    <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <button
        type="button"
        onClick={() => onOpenDetail(app._id)}
        className="w-full text-left"
      >
        <div className="flex items-start gap-2">
          {c?.profileImageUrl && (
            <img
              src={c.profileImageUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-teal-100"
              loading="lazy"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{c?.fullName || 'Candidate'}</p>
            <p className="truncate text-xs text-gray-500">{c?.email}</p>
          </div>
        </div>
        <span
          className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_BADGE_CLASSES[app.status] || 'bg-gray-100 text-gray-700'}`}
        >
          {STATUS_LABELS[app.status] || app.status}
        </span>
      </button>
      <div className="mt-2 flex flex-wrap gap-1.5 border-t border-gray-100 pt-2">
        {c?.resumeUrl && (
          <button
            type="button"
            disabled={openingResumeId === String(app._id)}
            onClick={async (e) => {
              e.stopPropagation()
              const id = String(app._id ?? '')
              setOpeningResumeId(id)
              try {
                await openApplicationResumeInNewTab(id)
              } finally {
                setOpeningResumeId(null)
              }
            }}
            className="rounded-md border border-teal-200 px-2 py-1 text-[11px] font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-60"
          >
            {openingResumeId === String(app._id) ? 'Opening…' : 'Resume'}
          </button>
        )}
        <select
          aria-label={`Status for ${c?.fullName || 'applicant'}`}
          value={app.status}
          disabled={isStatusPendingFor?.(app._id)}
          onChange={async (e) => {
            e.stopPropagation()
            const next = e.target.value
            try {
              await onStatusChange(app._id, next)
            } catch {
              /* toast in parent */
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-36 rounded-md border border-gray-300 px-1.5 py-1 text-[11px] shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {PIPELINE_STATUSES.map((st) => (
            <option key={st} value={st}>
              {STATUS_LABELS[st]}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
})

export function ApplicantsPipelinePanel({ jobId, onStatusChange, isStatusPendingFor }) {
  const jobKey = String(jobId)
  const [openingResumeId, setOpeningResumeId] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 360)
  const [skillInput, setSkillInput] = useState('')
  const debouncedSkill = useDebouncedValue(skillInput, 360)
  const [statusFilter, setStatusFilter] = useState('')

  const filters = useMemo(
    () => ({
      q: debouncedSearch.trim() || undefined,
      skill: debouncedSkill.trim() || undefined,
      status: statusFilter || undefined,
      page: 1,
      limit: 200,
    }),
    [debouncedSearch, debouncedSkill, statusFilter],
  )

  const applicationsQuery = useQuery({
    queryKey: queryKeys.recruiter.jobApplications(jobKey, filters),
    queryFn: () => listApplicationsForJob(jobKey, filters),
    placeholderData: keepPreviousData,
  })

  const applicationList = useMemo(
    () => applicationsQuery.data?.applications ?? [],
    [applicationsQuery.data?.applications],
  )

  const byStatus = useMemo(() => {
    const list = applicationList
    const map = Object.fromEntries(PIPELINE_STATUSES.map((s) => [s, []]))
    for (const app of list) {
      const bucket = map[app.status] != null ? app.status : 'applied'
      map[bucket].push(app)
    }
    return map
  }, [applicationList])

  const totalApplicants = applicationsQuery.data?.total ?? applicationList.length
  const showKanban = !statusFilter && totalApplicants > 0
  const showApplicationsSkeleton =
    !applicationsQuery.isError &&
    (applicationsQuery.isPending ||
      (applicationsQuery.isFetching && applicationList.length === 0))
  const showEmptyAll =
    !statusFilter &&
    totalApplicants === 0 &&
    !applicationsQuery.isFetching &&
    !applicationsQuery.isPending &&
    !applicationsQuery.isError
  const showFilteredEmpty =
    Boolean(statusFilter) &&
    applicationList.length === 0 &&
    !applicationsQuery.isFetching &&
    !applicationsQuery.isPending &&
    !applicationsQuery.isError

  return (
    <div className="mt-0">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-gray-50/90 p-4 dark:border-gray-700 dark:bg-gray-900/50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
              Applicant pipeline
            </p>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
              {totalApplicants} {totalApplicants === 1 ? 'applicant' : 'applicants'}
              {!applicationsQuery.isFetching ? '' : ' · updating…'}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email…"
              className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-600 dark:bg-gray-950 sm:min-w-44 sm:max-w-xs"
            />
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Skill…"
              className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-600 dark:bg-gray-950 sm:w-36"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-600 dark:bg-gray-950 sm:w-44"
            >
              <option value="">All stages</option>
              {PIPELINE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABELS[st]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showApplicationsSkeleton &&
        (statusFilter ? <ApplicantsPipelineListSkeleton /> : <ApplicantsPipelineKanbanSkeleton />)}

      {applicationsQuery.isError && (
        <p className="mt-3 text-sm text-red-600">Could not load applicants.</p>
      )}

      {!showApplicationsSkeleton && showKanban && (
        <div className="mt-4 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {PIPELINE_STATUSES.map((st) => (
            <section
              key={st}
              className="flex min-h-0 min-w-0 flex-col rounded-xl border border-gray-200/90 bg-white/90 shadow-sm dark:border-gray-700 dark:bg-gray-900/80"
            >
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5 dark:border-gray-700">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  {STATUS_LABELS[st]}
                </span>
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950/80 dark:text-teal-300">
                  {byStatus[st]?.length ?? 0}
                </span>
              </div>
              <div className="flex flex-col gap-2 overflow-y-auto p-2 max-h-64 lg:max-h-[min(28rem,55vh)]">
                {(byStatus[st] || []).map((app) => (
                  <PipelineApplicantCard
                    key={app._id}
                    app={app}
                    openingResumeId={openingResumeId}
                    setOpeningResumeId={setOpeningResumeId}
                    onOpenDetail={setDetailId}
                    onStatusChange={onStatusChange}
                    isStatusPendingFor={isStatusPendingFor}
                  />
                ))}
                {(byStatus[st] || []).length === 0 && (
                  <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-2 py-8 text-center text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-950/40">
                    No candidates
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {!showApplicationsSkeleton && Boolean(statusFilter) && (
        <div className="mt-4 space-y-2">
          {applicationList.map((app) => (
            <PipelineApplicantCard
              key={app._id}
              app={app}
              openingResumeId={openingResumeId}
              setOpeningResumeId={setOpeningResumeId}
              onOpenDetail={setDetailId}
              onStatusChange={onStatusChange}
              isStatusPendingFor={isStatusPendingFor}
            />
          ))}
          {showFilteredEmpty && (
            <p className="rounded-lg border border-dashed border-teal-200 bg-white/80 px-4 py-8 text-center text-sm text-gray-500">
              No applicants match your filters.
            </p>
          )}
        </div>
      )}

      {!showApplicationsSkeleton && showEmptyAll && (
        <p className="mt-4 rounded-lg border border-dashed border-teal-200 bg-white/80 px-4 py-8 text-center text-sm text-gray-500">
          No applicants yet. Share the job link to start receiving applications.
        </p>
      )}

      <ApplicantDetailModal
        open={Boolean(detailId)}
        applicationId={detailId}
        jobId={jobKey}
        onClose={() => setDetailId(null)}
        onStatusChange={onStatusChange}
        isStatusPendingFor={isStatusPendingFor}
      />
    </div>
  )
}
