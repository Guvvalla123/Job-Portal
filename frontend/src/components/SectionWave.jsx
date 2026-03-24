/**
 * Decorative wave divider between homepage sections (Indeed / Naukri–style polish).
 */
export function SectionWave({ flip = false, className = '' }) {
  return (
    <div
      className={`pointer-events-none relative z-[1] -mt-px leading-none text-gray-50 dark:text-gray-950 ${flip ? 'dark:text-gray-900' : ''} ${className}`}
      aria-hidden
    >
      <svg
        className={`block h-10 w-full md:h-14 ${flip ? 'rotate-180' : ''}`}
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0 24h1440v24H0V24zm0 0c240 32 480 0 720 16s480 32 720 0V0H0v24z" opacity={0.35} />
        <path d="M0 32c360 24 720-8 1080 8s360 16 360 16V48H0V32z" />
      </svg>
    </div>
  )
}
