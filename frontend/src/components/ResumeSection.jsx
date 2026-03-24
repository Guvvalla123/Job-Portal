import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '../api/apiClient.js'
import { useAuth } from '../context/useAuth.jsx'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import { queryKeys } from '../lib/queryKeys.js'
import { Button, Modal } from './ui/index.js'
import { ResumeViewer } from './resume/ResumeViewer.jsx'

const RESUME_MAX_SIZE = 2 * 1024 * 1024 // 2MB

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

  const uploadResumeMutation = useMutation({
    mutationFn: async (file) => {
      if (file.size > RESUME_MAX_SIZE) {
        throw new Error('File must be less than 2MB')
      }
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed')
      }
      const formData = new FormData()
      formData.append('resume', file)
      const response = await apiClient.post('/users/profile/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data.user
    },
    onSuccess: async (nextUser) => {
      onUserUpdate?.(nextUser)
      updateUser(nextUser)
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
      toast.success('Resume uploaded successfully')
      fileInputRef.current?.value && (fileInputRef.current.value = '')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Resume upload failed'))
    },
  })

  const deleteResumeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete('/users/profile/resume')
      return response.data.data.user
    },
    onSuccess: async (nextUser) => {
      onUserUpdate?.(nextUser)
      updateUser(nextUser)
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
      toast.success('Resume deleted successfully')
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

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete your resume? This cannot be undone.')) return
    deleteResumeMutation.mutate()
  }

  const hasResume = Boolean(user?.resumeUrl)
  const isUploading = uploadResumeMutation.isPending
  const isDeleting = deleteResumeMutation.isPending
  const isBusy = isUploading || isDeleting

  const displayName = user?.resumeFileName || (hasResume ? 'resume.pdf' : '')

  if (compact) {
    return (
      <>
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50">
              <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">Resume</p>
              <p className="text-xs text-gray-500 truncate">
                {hasResume ? displayName || 'Uploaded' : 'Not uploaded yet'}
              </p>
            </div>
          </div>
          {hasResume && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
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
            <ResumeViewer path="/users/profile/resume/file" title={displayName || 'Resume'} />
          ) : null}
        </Modal>
      </>
    )
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-sm font-semibold text-gray-900">Resume / CV</h2>
      <p className="mt-0.5 text-xs text-gray-500">PDF only, max 2MB</p>

      {hasResume ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0 text-xs text-gray-500">
                    {user?.resumeSize > 0 && <span>{formatFileSize(user.resumeSize)}</span>}
                    {user?.resumeUploadedAt && <span>Uploaded {formatDate(user.resumeUploadedAt)}</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                View
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isBusy}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>

          <label
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-gray-200 p-4 text-center transition-colors hover:border-indigo-300 ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-sm font-medium text-gray-600">
              {isUploading ? 'Uploading...' : 'Upload new resume (replaces current)'}
            </span>
            <span className="text-xs text-gray-400">PDF only, max 2MB</span>
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
          className={`mt-4 flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-gray-200 p-6 text-center transition-colors hover:border-indigo-300 hover:bg-gray-50/50 ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-sm font-medium text-gray-600">
            {isUploading ? 'Uploading...' : 'Upload resume'}
          </span>
          <span className="text-xs text-gray-400">PDF only, max 2MB</span>
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
          <ResumeViewer path="/users/profile/resume/file" title={displayName || 'Resume'} />
        ) : null}
      </Modal>
    </div>
  )
}
