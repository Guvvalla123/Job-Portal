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
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Profile strength</h3>
        <span className={`text-sm font-bold ${percent >= 80 ? 'text-emerald-600' : percent >= 50 ? 'text-amber-600' : 'text-gray-500'}`}>
          {percent}%
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-500 ${
            percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-500' : 'bg-gray-400'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {percent < 100 && (
        <p className="mt-2 text-xs text-gray-500">
          Add {checks.find((c) => !c.done)?.label?.toLowerCase()} to improve your profile.
        </p>
      )}
    </div>
  )
}
