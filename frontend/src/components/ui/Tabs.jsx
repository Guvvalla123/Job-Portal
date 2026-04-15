/* frontend/src/components/ui/Tabs.jsx */
/**
 * Tabs — scrollable on mobile, pill/underline variants with dark mode.
 */
export function Tabs({ tabs, activeTab, onChange, className = '', variant = 'underline' }) {
  const isPills = variant === 'pills'
  return (
    <div
      className={`${isPills ? 'rounded-2xl bg-gray-100/90 p-1 ring-1 ring-gray-200/80 dark:bg-gray-800/80 dark:ring-gray-700/80' : 'border-b border-gray-200 dark:border-gray-800'} ${className}`}
    >
      <nav
        className={`-mb-px flex gap-1 overflow-x-auto pb-2 sm:gap-2 sm:pb-0 ${isPills ? 'gap-1 pb-0' : ''}`}
        aria-label="Tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 whitespace-nowrap text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
              isPills
                ? `min-h-11 rounded-xl px-4 py-2.5 sm:min-h-10 ${
                    activeTab === tab.id
                      ? 'bg-white text-teal-800 shadow-soft dark:bg-gray-950 dark:text-teal-300'
                      : 'text-gray-600 hover:bg-white/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-100'
                  }`
                : `min-h-11 border-b-2 px-2 py-3 sm:min-h-10 sm:px-3 ${
                    activeTab === tab.id
                      ? 'border-teal-700 text-teal-700 dark:border-teal-400 dark:text-teal-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200'
                  }`
            }`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
                  isPills && activeTab === tab.id
                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200'
                    : 'bg-gray-200/90 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
