import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

const MotionDiv = motion.div
const MotionH1 = motion.h1
const MotionP = motion.p
const MotionUl = motion.ul

/**
 * Split auth shell: brand story + gradient panel (left / top on mobile),
 * glass form column (right). Used by Login, Register, Forgot/Reset password.
 */
export function AuthLayout({ title, subtitle, bullets = [], children }) {
  const reduceMotion = useReducedMotion()

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }

  const stagger = reduceMotion ? 0 : 0.08

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Brand panel */}
      <aside
        className="relative order-1 overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 px-6 py-10 sm:px-10 lg:order-none lg:flex lg:min-h-[calc(100dvh-3.5rem)] lg:flex-col lg:justify-center lg:px-14 lg:py-16 xl:px-20"
      >
        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl motion-safe:animate-pulse" />
        <div className="pointer-events-none absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl motion-safe:animate-pulse motion-safe:[animation-delay:1.2s]" />

        <div className="relative z-10 mx-auto w-full max-w-lg lg:mx-0">
          <MotionDiv
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl text-white/90 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-sm font-bold text-white shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
                JP
              </span>
              <span className="text-lg font-bold tracking-tight">JobPortal</span>
            </Link>
          </MotionDiv>

          <MotionH1
            className="mt-8 text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl lg:text-[2.35rem] lg:leading-tight xl:text-5xl"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: stagger }}
          >
            {title}
          </MotionH1>

          <MotionP
            className="mt-4 max-w-md text-base leading-relaxed text-indigo-100/90 sm:text-lg"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: stagger * 2 }}
          >
            {subtitle}
          </MotionP>

          {bullets.length > 0 && (
            <MotionUl
              className="mt-8 hidden space-y-4 sm:block"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...transition, delay: stagger * 3 }}
            >
              {bullets.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/85">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/30">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </MotionUl>
          )}
        </div>
      </aside>

      {/* Form column */}
      <div className="relative order-2 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10 lg:py-12 xl:px-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-indigo-950/5 via-transparent to-blue-500/5 dark:from-indigo-950/20 dark:to-blue-950/10 lg:bg-gradient-to-br" />

        <MotionDiv
          className="relative z-10 w-full max-w-md"
          initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...transition, delay: reduceMotion ? 0 : 0.06 }}
        >
          <div className="rounded-2xl border border-white/50 bg-white/80 p-8 shadow-2xl shadow-indigo-950/15 ring-1 ring-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/75 dark:shadow-black/40 dark:ring-white/10 sm:p-10">
            {children}
          </div>
        </MotionDiv>
      </div>
    </div>
  )
}
