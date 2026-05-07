import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { uploadResume, deleteResume } from '../api/userApi.js'
import { useAuth } from '../context/useAuth.jsx'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import { queryKeys } from '../lib/queryKeys.js'
import { Button, Modal } from './ui/index.js'
import { Tooltip } from './ui/Tooltip.jsx'
import { LazyResumeViewer } from './resume/LazyResumeViewer.jsx'

const RESUME_MAX_SIZE = 2 * 1024 * 1024 // 2MB

const IconEye = (props) => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const IconTrash = (props) => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const IconPencil = (props) => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
)

function formatFileSize(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ResumeSection({ user, onUserUpdate, compact = false }) {
  const queryClient = useQueryClient()
  const { updateUser } = useAuth()
  const fileInputRef = useRef(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const uploadResumeMutation = useMutation({
    mutationFn: async (file) => {
      if (file.size > RESUME_MAX_SIZE) {
        throw new Error('File must be less than 2MB')
      }
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed')
      }
      const r = await uploadResume(file)
      return r.user
    },
    onSuccess: async (nextUser) => {
      onUserUpdate?.(nextUser)
      updateUser(nextUser)
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.me(),
      })
      toast.success('Resume uploaded successfully!')
      fileInputRef.current?.value && (fileInputRef.current.value = '')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Resume upload failed'))
    },
  })

  const deleteResumeMutation = useMutation({
    mutationFn: async () => {
      const r = await deleteResume()
      return r.user
    },
    onSuccess: async (nextUser) => {
      setShowDeleteConfirm(false)
      onUserUpdate?.(nextUser)
      updateUser(nextUser)
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.me(),
      })
      toast.success('Resume deleted')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not delete resume'))
    },
  })

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed')
      e.target.value = ''
      return
    }
    if (file.size > RESUME_MAX_SIZE) {
      toast.error('File must be less than 2MB')
      e.target.value = ''
      return
    }
    uploadResumeMutation.mutate(file)
  }

  const handleConfirmDelete = () => {
    deleteResumeMutation.mutate()
  }

  /** API omits `resumeUrl` for privacy; use `hasResume` + filename from backend. */
  const hasResume = Boolean(user?.hasResume || user?.resumeFileName?.trim())
  const isUploading = uploadResumeMutation.isPending
  const isDeleting = deleteResumeMutation.isPending
  const isBusy = isUploading || isDeleting

  const displayName = user?.resumeFileName || (hasResume ? 'resume.pdf' : '')

  if (compact) {
    return (
      <>
        <div className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-900/50 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-950/50">
              <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">Resume</p>
              <p className="truncate text-xs text-gray-400">
                {hasResume ? displayName || 'Uploaded' : 'Not uploaded yet'}
              </p>
            </div>
          </div>
          {hasResume && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300"
              >
                View
              </button>
            </div>
          )}
        </div>
        <Modal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={displayName ? `Resume — ${displayName}` : 'Resume'}
          size="xl"
        >
          {previewOpen && hasResume ? (
            <LazyResumeViewer path="/users/profile/resume/file" title={displayName || 'Resume'} />
          ) : null}
        </Modal>
      </>
    )
  }

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-5">
      <h2 className="text-base font-semibold text-white">Resume / CV</h2>
      <p className="mt-0.5 text-sm text-gray-400">PDF only, max 2MB</p>

      {hasResume ? (
        <div className="mt-4 space-y-3">
          <div className="flex w-full min-w-0 flex-col gap-4 overflow-visible rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-950/50">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 sm:h-16 sm:w-16">
                <svg className="h-8 w-8 text-red-500 dark:text-red-400 sm:h-9 sm:w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="break-words text-base font-semibold leading-snug text-gray-900 dark:text-white">{displayName}</p>
                {user?.resumeSize > 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">{formatFileSize(user.resumeSize)}</p>
                ) : null}
                {user?.resumeUploadedAt ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Uploaded {formatDate(user.resumeUploadedAt)}</p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200/90 pt-3 dark:border-gray-700/90">
              {showDeleteConfirm ? (
                <>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Delete your resume?</p>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      loading={isDeleting}
                      loadingText="Deleting..."
                      onClick={handleConfirmDelete}
                    >
                      Delete
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex justify-around items-center w-full mt-2 px-2">
                  <Tooltip content="View Resume">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon-sm"
                      icon={<IconEye />}
                      onClick={() => setPreviewOpen(true)}
                      disabled={isBusy}
                      aria-label="View Resume"
                    />
                  </Tooltip>
                  <Tooltip content="Upload New Resume">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      icon={<IconPencil />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isBusy}
                      className="!shadow-none !ring-0 !bg-teal-100 !text-teal-600 hover:!bg-teal-200 focus-visible:!ring-2 focus-visible:!ring-teal-500/40 dark:!bg-teal-900/30 dark:!text-teal-400 dark:hover:!bg-teal-900/50 dark:focus-visible:!ring-teal-400/35"
                      aria-label="Upload New Resume"
                    />
                  </Tooltip>
                  <Tooltip content="Delete Resume">
                    <Button
                      type="button"
                      variant="danger"
                      size="icon-sm"
                      icon={<IconTrash />}
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isBusy}
                      aria-label="Delete Resume"
                    />
                  </Tooltip>
                </div>
              )}
            </div>
          </div>

          <label
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-gray-200 p-4 text-center transition-colors hover:border-teal-300 dark:border-gray-600 dark:hover:border-teal-500/50 ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {isUploading ? 'Uploading...' : 'Upload new resume (replaces current)'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">PDF only, max 2MB</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>
      ) : (
        <label
          className={`mt-4 flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-gray-200 p-6 text-center transition-colors hover:border-teal-300 hover:bg-gray-50/50 dark:border-gray-600 dark:hover:border-teal-500/50 dark:hover:bg-gray-800/30 ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {isUploading ? 'Uploading...' : 'Upload resume'}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">PDF only, max 2MB</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      )}

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={displayName ? `Resume — ${displayName}` : 'Resume'}
        size="xl"
      >
        {previewOpen && hasResume ? (
          <LazyResumeViewer path="/users/profile/resume/file" title={displayName || 'Resume'} />
        ) : null}
      </Modal>
    </div>
  )
}
