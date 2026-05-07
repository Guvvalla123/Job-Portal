export function ProfileCompletion({ user }) {
  if (!user) return null

  const checks = [
    { key: 'headline', label: 'Headline', done: Boolean(user.headline?.trim()) },
    { key: 'about', label: 'About', done: Boolean(user.about?.trim()) },
    { key: 'phone', label: 'Phone', done: Boolean(user.phone?.trim()) },
    { key: 'location', label: 'Location', done: Boolean(user.location?.trim()) },
    { key: 'skills', label: 'Skills', done: Array.isArray(user.skills) && user.skills.length > 0 },
    { key: 'experience', label: 'Work experience', done: Array.isArray(user.experience) && user.experience.length > 0 },
    { key: 'education', label: 'Education', done: Array.isArray(user.education) && user.education.length > 0 },
    {
      key: 'resume',
      label: 'Resume',
      done: Boolean(user.resumeUrl || user.hasResume || user.resumeFileName),
    },
    { key: 'photo', label: 'Profile photo', done: Boolean(user.profileImageUrl) },
  ]

  const done = checks.filter((c) => c.done).length
  const total = checks.length
  const percent = Math.round((done / total) * 100)

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Profile strength</h3>
        <span
          className={`text-sm font-bold ${
            percent >= 80 ? 'text-teal-400' : percent >= 50 ? 'text-amber-400' : 'text-gray-400'
          }`}
        >
          {percent}%
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-900">
        <div
          className={`h-full transition-all duration-500 ${
            percent >= 80 ? 'bg-teal-500' : percent >= 50 ? 'bg-amber-500' : 'bg-gray-600'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {percent < 100 && (
        <p className="mt-2 text-xs text-gray-400">
          Add {checks.find((c) => !c.done)?.label?.toLowerCase()} to improve your profile.
        </p>
      )}
    </div>
  )
}
