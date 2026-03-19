export function PasswordStrength({ password }) {
  if (!password) return null

  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  const levels = [
    { label: 'Weak', color: 'bg-red-500', width: 'w-1/5' },
    { label: 'Fair', color: 'bg-orange-500', width: 'w-2/5' },
    { label: 'Good', color: 'bg-yellow-500', width: 'w-3/5' },
    { label: 'Strong', color: 'bg-lime-500', width: 'w-4/5' },
    { label: 'Very strong', color: 'bg-emerald-500', width: 'w-full' },
  ]
  const level = levels[Math.max(0, score - 1)]
  const widthClass = ['w-0', 'w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-full'][score] || 'w-0'
  const colorClass = score >= 1 ? level.color : 'bg-gray-300'

  return (
    <div className="mt-1.5">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full transition-all duration-300 ${widthClass} ${colorClass} rounded-full`} />
      </div>
      <p className="mt-0.5 text-xs text-gray-500">
        {score === 0 && 'Use 6+ chars, mix of letters, numbers & symbols for a stronger password'}
        {score >= 1 && (
          <span className={score <= 2 ? 'text-amber-600' : score <= 4 ? 'text-lime-600' : 'text-emerald-600'}>
            {level.label}
          </span>
        )}
      </p>
    </div>
  )
}
