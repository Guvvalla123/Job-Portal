import { FUNNEL_SEGMENT_CLASSES, STATUS_LABELS } from './applicationPipeline.js'

export function formatChartMonth(isoYm) {
  if (!isoYm || typeof isoYm !== 'string') return ''
  const [y, m] = isoYm.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  if (Number.isNaN(d.getTime())) return isoYm
  return d.toLocaleString(undefined, { month: 'short', year: '2-digit' })
}

export function PipelineFunnelStrip({ byStatus = {} }) {
  const order = ['applied', 'screening', 'interview', 'offer', 'hired']
  const total = order.reduce((s, k) => s + (byStatus[k] || 0), 0)
  if (total === 0) {
    return <p className="text-xs text-gray-500 dark:text-gray-400">No applications in funnel yet.</p>
  }
  return (
    <div className="space-y-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        {order.map((k) => {
          const c = byStatus[k] || 0
          const pct = (c / total) * 100
          if (pct <= 0) return null
          return (
            <div
              key={k}
              title={`${STATUS_LABELS[k]}: ${c}`}
              className={FUNNEL_SEGMENT_CLASSES[k]}
              style={{ width: `${pct}%` }}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-600 dark:text-gray-400">
        {order.map((k) => (
          <span key={k}>
            {STATUS_LABELS[k]}: <strong className="text-gray-900 dark:text-gray-100">{byStatus[k] ?? 0}</strong>
          </span>
        ))}
        <span>
          Rejected: <strong className="text-gray-900 dark:text-gray-100">{byStatus.rejected ?? 0}</strong>
        </span>
      </div>
    </div>
  )
}
