import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Modal } from '../../components/ui/Modal.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { getApplication, updateRecruiterNotes, updateInterview } from '../../api/applicationsApi.js'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { openApplicationResumeInNewTab, downloadApplicationResume } from '../../lib/openApplicationResumeTab.js'
import {
  INTERVIEW_STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from './applicationPipeline.js'

function toDatetimeLocalValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatInterviewWhen(iso, timezone) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const base = d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  return timezone ? `${base} (${timezone})` : base
}

function deriveInterviewFromApp(app) {
  const inv = app?.interview
  return {
    scheduledAt: toDatetimeLocalValue(inv?.scheduledAt),
    durationMinutes: inv?.durationMinutes ?? 60,
    timezone: inv?.timezone ?? '',
    notes: inv?.notes ?? '',
    status: inv?.status ?? 'scheduled',
    syncPipelineStatus: true,
  }
}

function ApplicantDetailModalInner({ id, jKey, onClose, onStatusChange, isStatusPendingFor }) {
  const queryClient = useQueryClient()

  const detailQuery = useQuery({
    queryKey: queryKeys.recruiter.applicationDetail(id),
    queryFn: async () => {
      const d = await getApplication(id)
      return d.application
    },
  })

  const app = detailQuery.data
  const [notesOverride, setNotesOverride] = useState(null)
  const notesDraft = notesOverride !== null ? notesOverride : (app?.recruiterNotes ?? '')

  const [interviewOverride, setInterviewOverride] = useState(null)
  const baseInterview = deriveInterviewFromApp(app)
  const interviewLocal = interviewOverride ?? baseInterview

  const setInterviewField = (partial) => {
    setInterviewOverride((prev) => ({ ...(prev ?? deriveInterviewFromApp(app)), ...partial }))
  }

  const invalidateJobApps = () => {
    void queryClient.invalidateQueries({ queryKey: ['recruiter', 'job-applications', jKey] })
    void queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.upcomingInterviews() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.analytics() })
  }

  const notesMutation = useMutation({
    mutationFn: (recruiterNotes) => updateRecruiterNotes(id, recruiterNotes),
    onSuccess: async (data) => {
      const next = data?.application
      if (next) {
        queryClient.setQueryData(queryKeys.recruiter.applicationDetail(id), (old) =>
          old && next ? { ...old, recruiterNotes: next.recruiterNotes } : old,
        )
      }
      setNotesOverride(null)
      invalidateJobApps()
      toast.success('Notes saved.')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not save notes.')),
  })

  const interviewMutation = useMutation({
    mutationFn: (body) => updateInterview(id, body),
    onSuccess: async (data) => {
      const next = data?.application
      if (next) {
        queryClient.setQueryData(queryKeys.recruiter.applicationDetail(id), () => next)
      }
      setInterviewOverride(null)
      invalidateJobApps()
      toast.success('Interview updated.')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update interview.')),
  })

  const candidate = app?.candidate
  const title = candidate?.fullName || 'Applicant details'

  const handleSaveInterview = () => {
    const scheduledAt =
      interviewLocal.scheduledAt && interviewLocal.scheduledAt.trim()
        ? new Date(interviewLocal.scheduledAt).toISOString()
        : null
    interviewMutation.mutate({
      scheduledAt,
      durationMinutes: Number(interviewLocal.durationMinutes) || 60,
      timezone: interviewLocal.timezone || undefined,
      notes: interviewLocal.notes || undefined,
      status: interviewLocal.status,
      syncPipelineStatus: interviewLocal.syncPipelineStatus,
    })
  }

  const clearInterview = () => {
    interviewMutation.mutate({
      scheduledAt: null,
      syncPipelineStatus: false,
    })
  }

  return (
    <Modal open onClose={onClose} title={title} size="xl">
      {detailQuery.isPending && (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {detailQuery.isError && (
        <p className="text-sm text-red-600">{getApiErrorMessage(detailQuery.error, 'Could not load applicant.')}</p>
      )}

      {app && candidate && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">{candidate.email}</p>
              {candidate.phone && <p className="text-sm text-gray-600">{candidate.phone}</p>}
              {candidate.headline && <p className="mt-1 text-sm text-gray-700">{candidate.headline}</p>}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_BADGE_CLASSES[app.status] || 'bg-gray-100 text-gray-700'}`}
            >
              {STATUS_LABELS[app.status] || app.status}
            </span>
          </div>

          {Array.isArray(candidate.skills) && candidate.skills.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Skills</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {candidate.skills.map((s) => (
                  <span key={s} className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(candidate.experience) && candidate.experience.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Experience</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                {candidate.experience.map((ex) => (
                  <li key={ex._id || `${ex.title}-${ex.company}`} className="rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-100">
                    <span className="font-medium text-gray-900">{ex.title}</span>
                    <span className="text-gray-500"> · {ex.company}</span>
                    {(ex.startDate || ex.endDate) && (
                      <p className="text-xs text-gray-500">
                        {ex.startDate}
                        {ex.current ? ' — Present' : ex.endDate ? ` — ${ex.endDate}` : ''}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Resume</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {candidate.resumeUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => openApplicationResumeInNewTab(id)}
                    className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                  >
                    Open in new tab
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadApplicationResume(id, candidate.resumeFileName || `${candidate.fullName || 'resume'}.pdf`)
                    }
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Download PDF
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500">No resume on file.</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Quick pipeline</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ['screening', 'Screening'],
                ['interview', 'Interview'],
                ['offer', 'Offer'],
                ['hired', 'Hired'],
                ['rejected', 'Reject'],
              ].map(([st, label]) => (
                <button
                  key={st}
                  type="button"
                  disabled={isStatusPendingFor?.(id) || app.status === st}
                  onClick={async () => {
                    try {
                      await onStatusChange(id, st)
                      queryClient.setQueryData(queryKeys.recruiter.applicationDetail(id), (old) =>
                        old ? { ...old, status: st } : old,
                      )
                    } catch {
                      /* parent shows toast */
                    }
                  }}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor={`rc-notes-${id}`} className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Recruiter notes
            </label>
            <textarea
              id={`rc-notes-${id}`}
              value={notesDraft}
              onChange={(e) => setNotesOverride(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Private notes — only your team sees this."
            />
            <button
              type="button"
              disabled={notesMutation.isPending}
              onClick={() => notesMutation.mutate(notesDraft)}
              className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {notesMutation.isPending ? 'Saving…' : 'Save notes'}
            </button>
          </div>

          <div className="rounded-xl bg-indigo-50/40 p-4 ring-1 ring-indigo-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Interview</p>
            {app.interview?.scheduledAt && (
              <p className="mt-2 text-sm text-gray-700">
                Scheduled:{' '}
                <span className="font-medium">
                  {formatInterviewWhen(app.interview.scheduledAt, app.interview.timezone)}
                </span>
                {app.interview.status && (
                  <span className="ml-2 rounded-md bg-white px-2 py-0.5 text-xs font-medium text-indigo-800 ring-1 ring-indigo-200">
                    {INTERVIEW_STATUS_LABELS[app.interview.status] || app.interview.status}
                  </span>
                )}
              </p>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-600" htmlFor={`int-when-${id}`}>
                  Date & time
                </label>
                <input
                  id={`int-when-${id}`}
                  type="datetime-local"
                  value={interviewLocal.scheduledAt}
                  onChange={(e) => setInterviewField({ scheduledAt: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600" htmlFor={`int-dur-${id}`}>
                  Duration (min)
                </label>
                <select
                  id={`int-dur-${id}`}
                  value={String(interviewLocal.durationMinutes)}
                  onChange={(e) => setInterviewField({ durationMinutes: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {[15, 30, 45, 60, 90, 120].map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600" htmlFor={`int-tz-${id}`}>
                  Timezone (optional)
                </label>
                <input
                  id={`int-tz-${id}`}
                  value={interviewLocal.timezone}
                  onChange={(e) => setInterviewField({ timezone: e.target.value })}
                  placeholder="e.g. Asia/Tokyo"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-600" htmlFor={`int-notes-${id}`}>
                  Interview notes
                </label>
                <textarea
                  id={`int-notes-${id}`}
                  value={interviewLocal.notes}
                  onChange={(e) => setInterviewField({ notes: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600" htmlFor={`int-st-${id}`}>
                  Interview status
                </label>
                <select
                  id={`int-st-${id}`}
                  value={interviewLocal.status}
                  onChange={(e) => setInterviewField({ status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {Object.entries(INTERVIEW_STATUS_LABELS).map(([k, lab]) => (
                    <option key={k} value={k}>
                      {lab}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={interviewLocal.syncPipelineStatus}
                    onChange={(e) => setInterviewField({ syncPipelineStatus: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Move pipeline to Interview when scheduled
                </label>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={interviewMutation.isPending}
                onClick={handleSaveInterview}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {interviewMutation.isPending ? 'Saving…' : 'Save interview'}
              </button>
              <button
                type="button"
                disabled={
                  interviewMutation.isPending ||
                  !(interviewLocal.scheduledAt || app.interview?.scheduledAt)
                }
                onClick={clearInterview}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Clear schedule
              </button>
            </div>
          </div>

          {app.coverLetter && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Cover letter</p>
              <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 ring-1 ring-gray-100">{app.coverLetter}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export function ApplicantDetailModal({ open, applicationId, jobId, onClose, onStatusChange, isStatusPendingFor }) {
  const id = applicationId ? String(applicationId) : ''
  const jKey = jobId ? String(jobId) : ''
  if (!open || !id) return null
  return (
    <ApplicantDetailModalInner
      key={id}
      id={id}
      jKey={jKey}
      onClose={onClose}
      onStatusChange={onStatusChange}
      isStatusPendingFor={isStatusPendingFor}
    />
  )
}
