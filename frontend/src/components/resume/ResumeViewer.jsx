import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { apiClient } from '@/api/apiClient.js'
import { AUTH_KEYS } from '@/lib/authConstants.js'

/** Delay before revoking blob URLs used only for a spawned tab (viewer keeps a handle briefly). */
const REVOKE_TAB_URL_MS = 180_000

function resolveResumePath(path, applicationId) {
  if (applicationId != null && String(applicationId).trim() !== '') {
    return `/applications/${String(applicationId).trim()}/resume`
  }
  if (path) {
    return path.startsWith('/') ? path : `/${path}`
  }
  return null
}

async function blobFromResumeResponse(res) {
  const ct = res.headers['content-type'] || ''
  const raw = res.data

  if (raw instanceof Blob && raw.size > 0 && ct.includes('application/json')) {
    const text = await raw.text()
    let msg = 'Could not load resume. Try again or contact support.'
    try {
      const j = JSON.parse(text)
      if (j?.message) msg = j.message
    } catch {
      /* keep msg */
    }
    throw new Error(msg)
  }

  return raw instanceof Blob
    ? raw.type === 'application/pdf' || ct.includes('pdf')
      ? raw
      : new Blob([raw], { type: 'application/pdf' })
    : new Blob([raw], { type: 'application/pdf' })
}

/**
 * Authenticated PDF via apiClient; inline preview + open in new tab (native PDF viewer).
 * @param {{ path?: string, applicationId?: string, title?: string }} props
 */
export function ResumeViewer({ path, applicationId, title = 'Resume' }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openingTab, setOpeningTab] = useState(false)

  const resumePath = resolveResumePath(path, applicationId)

  const fetchAuthorizedPdfBlob = useCallback(async () => {
    const token = localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN)
    if (!token) {
      throw new Error('Please sign in to view this resume.')
    }
    if (!resumePath) {
      throw new Error('No resume to load.')
    }
    const res = await apiClient.get(resumePath, {
      responseType: 'blob',
      timeout: 120000,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return blobFromResumeResponse(res)
  }, [resumePath])

  useEffect(() => {
    let cancelled = false
    let objectUrl = null

    async function loadResume() {
      setLoading(true)
      setError(null)
      setBlobUrl(null)

      try {
        const blob = await fetchAuthorizedPdfBlob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load resume. Try again or contact support.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadResume()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fetchAuthorizedPdfBlob])

  const handleOpenInNewTab = useCallback(async () => {
    if (blobUrl) {
      const win = window.open(blobUrl, '_blank', 'noopener,noreferrer')
      if (!win) {
        toast.error('Pop-up blocked. Allow pop-ups for this site to open the PDF in a new tab.')
      }
      return
    }

    setOpeningTab(true)
    let tabUrl = null
    try {
      const blob = await fetchAuthorizedPdfBlob()
      tabUrl = URL.createObjectURL(blob)
      const win = window.open(tabUrl, '_blank', 'noopener,noreferrer')
      if (!win) {
        URL.revokeObjectURL(tabUrl)
        tabUrl = null
        toast.error('Pop-up blocked. Allow pop-ups for this site to open the PDF in a new tab.')
        return
      }
      window.setTimeout(() => {
        if (tabUrl) URL.revokeObjectURL(tabUrl)
      }, REVOKE_TAB_URL_MS)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not open resume.')
    } finally {
      setOpeningTab(false)
    }
  }, [blobUrl, fetchAuthorizedPdfBlob])

  if (loading) {
    return (
      <div className="flex min-h-[min(75vh,720px)] items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400" />
          <p className="mt-4 text-sm font-medium">Loading resume…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void handleOpenInNewTab()}
            disabled={openingTab || !resumePath}
            className="rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-800 dark:bg-gray-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
          >
            {openingTab ? 'Opening…' : 'Try open in new tab'}
          </button>
        </div>
      </div>
    )
  }

  if (!blobUrl) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-600 dark:border-gray-700 dark:bg-gray-900/50">
        <p className="text-sm">No preview available.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Preview is scaled in-page. For full quality and browser PDF tools, open in a new tab.
        </p>
        <button
          type="button"
          onClick={() => void handleOpenInNewTab()}
          disabled={openingTab}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          {openingTab ? 'Opening…' : 'Open in new tab'}
        </button>
      </div>
      <iframe
        title={title}
        src={`${blobUrl}#toolbar=1`}
        className="min-h-[min(80vh,800px)] w-full flex-1 rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-900"
      />
    </div>
  )
}
