import { toast } from 'sonner'

/**
 * Native Web Share when available; otherwise copy URL to clipboard.
 * @param {{ title?: string, companyName?: string, url: string }} opts
 */
export async function shareJobListing({ title = '', companyName = '', url }) {
  const text = `${companyName || 'This company'} is hiring!`
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url })
    } catch (err) {
      if (err?.name === 'AbortError') return
    }
    return
  }
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  } catch {
    toast.error('Could not copy link.')
  }
}
