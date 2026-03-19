/**
 * Tabs component for dashboard sections
 */
export function Tabs({ tabs, activeTab, onChange, className = '', variant = 'underline' }) {
  const isPills = variant === 'pills'
  return (
    <div className={`${isPills ? 'p-1' : 'border-b border-gray-200'} ${className}`}>
      <nav className={`-mb-px flex gap-6 overflow-x-auto pb-2 sm:pb-0 ${isPills ? 'gap-1' : ''}`} aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 whitespace-nowrap text-sm font-medium transition-colors ${
              isPills
                ? `rounded-lg px-4 py-2.5 ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                : `border-b-2 py-3 ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`
            }`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
            {tab.count != null && (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                isPills && activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
