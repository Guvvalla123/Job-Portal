import { toast } from 'sonner'
import { getAccessToken } from '../api/apiClient.js'
import { fetchApplicationResume } from '../api/applicationsApi.js'
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
  if (!getAccessToken()) {
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
    const res = await fetchApplicationResume(id)

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

/**
 * Fetches GET /applications/:id/resume with JWT and triggers a file download.
 */
export async function downloadApplicationResume(applicationId, suggestedFileName = 'resume.pdf') {
  if (!getAccessToken()) {
    toast.error('Please sign in to download this resume.')
    return
  }

  const id = String(applicationId ?? '').trim()
  if (!id) {
    toast.error('Invalid application.')
    return
  }

  let blobUrl = null
  try {
    const res = await fetchApplicationResume(id)

    const blob = await pdfBlobFromResumeResponse(res)
    blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = suggestedFileName.endsWith('.pdf') ? suggestedFileName : `${suggestedFileName}.pdf`
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }, REVOKE_TAB_URL_MS)
  } catch (err) {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    toast.error(getApiErrorMessage(err, 'Could not download resume.'))
  }
}
