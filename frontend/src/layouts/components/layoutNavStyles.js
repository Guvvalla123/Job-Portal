export const linkBase =
  'inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors md:min-h-0 md:py-1.5'

export const activeStyle = ({ isActive }) =>
  `${linkBase} ${isActive ? 'bg-white/20 text-white' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`

export const mobileLinkBase =
  'flex min-h-12 items-center rounded-xl px-4 py-3 text-base font-medium transition-colors active:scale-[0.99]'

export const mobileActiveStyle = ({ isActive }) =>
  `${mobileLinkBase} ${isActive ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200' : 'text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800'}`
