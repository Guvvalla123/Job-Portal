import { lazy, Suspense } from 'react'

const ResumeViewer = lazy(() =>
  import('./ResumeViewer.jsx').then((m) => ({ default: m.ResumeViewer })),
)

function ResumePreviewFallback() {
  return (
    <div
      className="flex min-h-50 items-center justify-center py-12"
      role="status"
      aria-label="Loading resume preview"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-200 border-t-teal-700 dark:border-teal-900 dark:border-t-teal-400" />
    </div>
  )
}

/** Code-splits the PDF viewer until the modal opens (parent should gate on open + resumeUrl). */
export function LazyResumeViewer(props) {
  return (
    <Suspense fallback={<ResumePreviewFallback />}>
      <ResumeViewer {...props} />
    </Suspense>
  )
}
