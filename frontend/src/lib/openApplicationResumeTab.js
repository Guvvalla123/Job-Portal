import { toast } from 'sonner'
import { apiClient } from '../api/apiClient.js'
import { AUTH_KEYS } from './authConstants.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'

const REVOKE_TAB_URL_MS = 180_000

async function pdfBlobFromResumeResponse(res) {
  const ct = res.headers['content-type'] || ''
  const raw = res.data

  if (raw instanceof Blob && raw.size > 0 && ct.includes('application/json')) {
    const text = await raw.text()
    let msg = 'Could not load resume.'
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
 * Fetches GET /applications/:id/resume with JWT, opens PDF in a new tab (native viewer).
 */
export async function openApplicationResumeInNewTab(applicationId) {
  const token = localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN)
  if (!token) {
    toast.error('Please sign in to view this resume.')
    return
  }

  const id = String(applicationId ?? '').trim()
  if (!id) {
    toast.error('Invalid application.')
    return
  }

  let tabUrl = null
  try {
    const res = await apiClient.get(`/applications/${id}/resume`, {
      responseType: 'blob',
      timeout: 120000,
      headers: { Authorization: `Bearer ${token}` },
    })

    const blob = await pdfBlobFromResumeResponse(res)
    tabUrl = URL.createObjectURL(blob)
    const win = window.open(tabUrl, '_blank', 'noopener,noreferrer')
    if (!win) {
      URL.revokeObjectURL(tabUrl)
      toast.error('Pop-up blocked. Allow pop-ups for this site to open the PDF.')
      return
    }
    window.setTimeout(() => {
      if (tabUrl) URL.revokeObjectURL(tabUrl)
    }, REVOKE_TAB_URL_MS)
  } catch (err) {
    if (tabUrl) URL.revokeObjectURL(tabUrl)
    toast.error(getApiErrorMessage(err, 'Could not open resume.'))
  }
}
