/**
 * Defense-in-depth: hide draft or expired jobs if the API ever returned them.
 * Backend is source of truth; this only filters client-side display.
 */
export function filterPublicJobs(jobs) {
  if (!Array.isArray(jobs) || jobs.length === 0) return jobs
  const now = Date.now()
  return jobs.filter((job) => {
    if (job?.isDraft === true) return false
    const exp = job?.expiresAt
    if (exp == null) return true
    const t = new Date(exp).getTime()
    if (Number.isNaN(t)) return true
    return t > now
  })
}
