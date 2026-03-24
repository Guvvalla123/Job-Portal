import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../context/useAuth.jsx'
import { queryKeys } from '../lib/queryKeys.js'
import { CACHE_TIERS } from '../lib/queryOptions.js'
import { apiClient } from '../api/apiClient.js'
import { SaveJobButton } from '../components/SaveJobButton.jsx'
import { Card, Badge, JobCardSkeleton } from '../components/ui/index.js'
import { SectionWave } from '../components/SectionWave.jsx'
import { useCountUp } from '../hooks/useCountUp.js'
import { formatSalaryRange } from '../utils/formatSalary.js'

const TYPE_BADGE = { 'full-time': 'success', 'part-time': 'info', contract: 'warning', internship: 'primary' }

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2400&q=80'

/** Decorative career illustration (free SVG – swap for brand asset) */
const CAREER_ILLUSTRATION =
  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80'

const JOB_CATEGORIES = [
  {
    title: 'Engineering',
    blurb: 'Backend, frontend, DevOps & more',
    href: '/jobs?q=engineering',
    gradient: 'from-violet-500 to-purple-600',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    title: 'Product & Design',
    blurb: 'UX, UI, product management',
    href: '/jobs?q=product',
    gradient: 'from-pink-500 to-rose-600',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Data & AI',
    blurb: 'Analytics, ML, data science',
    href: '/jobs?q=data',
    gradient: 'from-cyan-500 to-blue-600',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Marketing',
    blurb: 'Growth, content, brand',
    href: '/jobs?q=marketing',
    gradient: 'from-amber-500 to-orange-600',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
  },
  {
    title: 'Sales & CS',
    blurb: 'Account execs, success, support',
    href: '/jobs?q=sales',
    gradient: 'from-emerald-500 to-teal-600',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Finance & Ops',
    blurb: 'Accounting, HR, operations',
    href: '/jobs?q=finance',
    gradient: 'from-slate-600 to-slate-800',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

const STAT_META = [
  {
    key: 'jobs',
    fallback: 1000,
    sub: 'Active listings updated daily',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'companies',
    fallback: 500,
    sub: 'From startups to enterprises',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: 'free',
    display: 'Free to Use',
    sub: 'No hidden fees for job seekers',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'match',
    display: 'Smart Matching',
    sub: 'Recommendations from your profile',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: 'Search & filter',
    description: 'Filter by role, location, seniority, and work style — same signals recruiters use.',
  },
  {
    step: '02',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Apply in one flow',
    description: 'Resume on file, tailored cover letter, and instant confirmation — no tab chaos.',
  },
  {
    step: '03',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Track everything',
    description: 'Pipeline status, recruiter messages, and saved roles — all in your dashboard.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'Found my dream role in two weeks. Filters actually matched how I search on LinkedIn.',
    author: 'Sarah M.',
    role: 'Software Engineer',
    seed: 'sarah-m',
  },
  {
    quote: 'We hired 15+ people through JobPortal last year. Quality of applicants stayed consistently high.',
    author: 'James K.',
    role: 'Head of Talent',
    seed: 'james-k',
  },
  {
    quote: 'One-click apply with my resume on file — three interviews in my first week.',
    author: 'Priya R.',
    role: 'Product Designer',
    seed: 'priya-r',
  },
]

function testimonialAvatar(seed) {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=c7d2fe`
}

export function HomePage() {
  const { isAuthenticated, user } = useAuth()

  const featuredJobsQuery = useQuery({
    queryKey: queryKeys.jobs.list({ page: 1, limit: 6 }),
    queryFn: async () => {
      const { data } = await apiClient.get('/jobs', { params: { page: 1, limit: 6 } })
      return data.data
    },
    staleTime: CACHE_TIERS.public.staleTime,
    gcTime: CACHE_TIERS.public.gcTime,
  })

  const companiesQuery = useQuery({
    queryKey: queryKeys.companies.list({ page: 1 }),
    queryFn: async () => {
      const { data } = await apiClient.get('/companies', { params: { page: 1, limit: 8 } })
      return data.data
    },
    staleTime: CACHE_TIERS.public.staleTime,
    gcTime: CACHE_TIERS.public.gcTime,
  })

  const featuredJobs = featuredJobsQuery.data?.jobs || []
  const companies = companiesQuery.data?.companies || []
  const jobCount = featuredJobsQuery.data?.pagination?.total ?? 0
  const companyCount = companiesQuery.data?.pagination?.total ?? 0

  const jobTarget = jobCount > 0 ? Math.min(jobCount, 999999) : STAT_META[0].fallback
  const companyTarget = companyCount > 0 ? Math.min(companyCount, 999999) : STAT_META[1].fallback
  const jobsAnimated = useCountUp(jobTarget, { enabled: true })
  const companiesAnimated = useCountUp(companyTarget, { enabled: true })

  return (
    <>
      <Helmet>
        <title>JobPortal | Find Your Dream Job – Connect with Top Employers</title>
        <meta name="description" content="Find your dream job on JobPortal. Browse thousands of jobs from top companies. Search by role, location, and skills. Free for job seekers." />
        <meta property="og:title" content="JobPortal | Find Your Dream Job" />
        <meta property="og:description" content="Connect with top employers, discover opportunities that match your skills, and take the next step in your career." />
        <meta property="og:type" content="website" />
      </Helmet>

      <main className="overflow-hidden">
        {/* Hero */}
        <section className="relative isolate min-h-[min(92vh,720px)] overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="absolute inset-0 -z-20">
            <img
              src={HERO_IMAGE}
              alt=""
              width={2400}
              height={1350}
              className="h-full min-h-[520px] w-full scale-105 object-cover object-[center_30%] motion-safe:transition-transform motion-safe:duration-[20s] motion-safe:ease-out motion-safe:hover:scale-100"
              fetchPriority="high"
              decoding="async"
            />
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-950/93 via-indigo-900/88 to-slate-950/92" aria-hidden />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/55 via-blue-950/20 to-indigo-800/35" aria-hidden />
          <div
            className="absolute inset-0 -z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-70"
            aria-hidden
          />
          <div className="pointer-events-none absolute -left-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-cyan-400/20 blur-[100px] motion-safe:animate-hero-float" aria-hidden />
          <div
            className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-violet-500/25 blur-[90px] motion-safe:animate-hero-float"
            style={{ animationDelay: '-7s' }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-1/3 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-blue-400/15 blur-[80px] motion-safe:animate-hero-float"
            style={{ animationDelay: '-3.5s' }}
            aria-hidden
          />

          <div className="relative mx-auto max-w-4xl text-center">
            <span
              className="inline-flex animate-fade-in-up items-center rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white shadow-lg ring-1 ring-white/20 backdrop-blur-md"
              style={{ animationDelay: '0.05s' }}
            >
              Trusted by teams hiring at scale
            </span>
            <h1
              className="text-display mt-6 animate-fade-in-up text-4xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl md:leading-[1.1]"
              style={{ animationDelay: '0.12s' }}
            >
              Find work that fits your{' '}
              <span className="bg-gradient-to-r from-cyan-200 to-white bg-clip-text text-transparent">ambition</span>
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl animate-fade-in-up text-lg leading-8 text-blue-50/95"
              style={{ animationDelay: '0.2s' }}
            >
              Premium job discovery — rich company profiles, transparent roles, and applications that respect your time.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.28s' }}>
              <Link
                to="/jobs"
                className="inline-flex items-center rounded-2xl bg-gradient-to-r from-white to-blue-50 px-8 py-3.5 text-base font-semibold text-blue-800 shadow-xl shadow-black/20 transition-all hover:scale-[1.03] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-900"
              >
                Explore jobs
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-2xl border-2 border-white/50 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-all hover:scale-[1.03] hover:border-white/80 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-900"
                >
                  Create free account
                </Link>
              )}
              {user?.role === 'recruiter' && (
                <Link
                  to="/recruiter/dashboard"
                  className="inline-flex items-center rounded-2xl border-2 border-white/50 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-all hover:scale-[1.03] hover:bg-white/20"
                >
                  Post a role
                </Link>
              )}
            </div>
          </div>
        </section>

        <SectionWave />

        {/* Stats */}
        <section className="relative bg-gray-50 py-16 dark:bg-gray-900">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent dark:via-indigo-600/30" aria-hidden />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STAT_META.map((item, i) => {
                const isJobs = item.key === 'jobs'
                const isCompanies = item.key === 'companies'
                let headline
                if (isJobs) {
                  headline = `${jobsAnimated.toLocaleString()}+ Jobs`
                } else if (isCompanies) {
                  headline = `${companiesAnimated.toLocaleString()}+ Companies`
                } else {
                  headline = item.display
                }
                return (
                  <div
                    key={item.key}
                    className="group relative overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-white to-indigo-50/40 p-6 text-center shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-100/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-gray-700/80 dark:from-gray-800/90 dark:to-indigo-950/40 dark:ring-indigo-900/30 dark:hover:shadow-indigo-900/20 motion-reduce:hover:translate-y-0"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-400/10 blur-2xl transition-opacity group-hover:opacity-100 dark:bg-indigo-400/20" aria-hidden />
                    <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30 transition-transform duration-300 group-hover:scale-110">
                      {item.icon}
                    </div>
                    <p className="relative text-xl font-bold text-indigo-900 dark:text-indigo-200 sm:text-2xl">{headline}</p>
                    <p className="relative mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">{item.sub}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <SectionWave flip className="text-gray-50 dark:text-gray-900" />

        {/* Featured jobs */}
        <section className="relative bg-gradient-to-b from-gray-50 via-white to-gray-50 py-20 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Live listings</p>
                <h2 className="text-display mt-1 text-3xl font-bold text-gray-900 dark:text-white">Featured roles</h2>
                <p className="mt-2 max-w-xl text-gray-600 dark:text-gray-400">Hand-picked openings with salary clarity and stack tags — updated as teams post.</p>
              </div>
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-gray-800 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
              >
                View all jobs
                <span aria-hidden>→</span>
              </Link>
            </div>

            {featuredJobsQuery.isLoading ? (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : featuredJobs.length > 0 ? (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredJobs.map((job) => (
                  <Card key={job._id} variant="premium" hover padding="default" className="group/card flex flex-col">
                    <div className="flex gap-4">
                      {job.company?.logoUrl ? (
                        <img
                          src={job.company.logoUrl}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-md ring-2 ring-white dark:ring-gray-700"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 text-lg font-bold text-indigo-700 dark:from-indigo-900/50 dark:to-blue-900/50 dark:text-indigo-300">
                          {job.company?.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="line-clamp-2 text-lg font-semibold text-gray-900 transition-colors group-hover/card:text-indigo-600 dark:text-white dark:group-hover/card:text-indigo-400"
                        >
                          {job.title}
                        </Link>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                          {job.company?.name} · {job.location}
                        </p>
                      </div>
                    </div>
                    {(job.minSalary > 0 || job.maxSalary > 0) && (
                      <div className="mt-4">
                        <Badge variant="success" size="md" className="font-semibold">
                          {formatSalaryRange(job.minSalary, job.maxSalary)}
                        </Badge>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.employmentType && (
                        <Badge variant={TYPE_BADGE[job.employmentType] || 'default'} size="sm">
                          {job.employmentType}
                        </Badge>
                      )}
                      {job.experienceLevel && <Badge variant="default" size="sm">{job.experienceLevel}</Badge>}
                    </div>
                    {job.skills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.skills.slice(0, 4).map((skill) => (
                          <Badge key={skill} variant="primary" size="sm">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-5 dark:border-gray-700/80">
                      <Link
                        to={`/jobs/${job._id}`}
                        className="text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-800 dark:text-indigo-400"
                      >
                        View role →
                      </Link>
                      <SaveJobButton jobId={job._id} />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="mt-12 rounded-3xl border border-dashed border-gray-200 bg-white/80 p-14 text-center dark:border-gray-700 dark:bg-gray-800/50">
                <p className="text-gray-600 dark:text-gray-400">Fresh roles are on the way. Browse the full directory.</p>
                <Link
                  to="/jobs"
                  className="mt-4 inline-flex rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500"
                >
                  Browse jobs
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Categories */}
        <section className="border-y border-gray-200/80 bg-white py-20 dark:border-gray-800 dark:bg-gray-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Browse by craft</p>
              <h2 className="text-display mt-2 text-3xl font-bold text-gray-900 dark:text-white">Job categories</h2>
              <p className="mx-auto mt-2 max-w-2xl text-gray-600 dark:text-gray-400">Jump into the discipline that matches your skills — we&apos;ll surface relevant employers.</p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {JOB_CATEGORIES.map((cat) => (
                <Link
                  key={cat.title}
                  to={cat.href}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/80 dark:hover:border-indigo-800 motion-reduce:hover:translate-y-0"
                >
                  <div
                    className={`inline-flex rounded-xl bg-gradient-to-br ${cat.gradient} p-3 text-white shadow-lg transition-transform group-hover:scale-110`}
                  >
                    {cat.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{cat.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{cat.blurb}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    Explore roles <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Companies + illustration strip */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 py-20 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
            <img src={CAREER_ILLUSTRATION} alt="" className="h-full w-full object-cover object-center" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/95 via-indigo-900/90 to-blue-950/95" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-xl">
                <p className="text-sm font-bold uppercase tracking-wider text-indigo-300">Employer spotlight</p>
                <h2 className="text-display mt-2 text-3xl font-bold">Companies hiring now</h2>
                <p className="mt-2 text-indigo-100/90">Discover teams with open reqs — logos, locations, and culture in one place.</p>
              </div>
              <Link
                to="/companies"
                className="inline-flex shrink-0 items-center rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/20"
              >
                View directory →
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(companies.length > 0 ? companies.slice(0, 8) : [...Array(8)]).map((company, idx) =>
                company ? (
                  <Link
                    key={company._id}
                    to={`/companies/${company._id}`}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all hover:border-white/25 hover:bg-white/10 hover:shadow-lg"
                  >
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/20" loading="lazy" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-blue-500 text-lg font-bold text-white">
                        {company.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-white">{company.name}</h3>
                      {company.location && <p className="truncate text-sm text-indigo-200">{company.location}</p>}
                    </div>
                  </Link>
                ) : (
                  <div
                    key={`placeholder-${idx}`}
                    className="flex items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 backdrop-blur-sm"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-indigo-200">
                      ?
                    </div>
                    <div>
                      <p className="text-sm font-medium text-indigo-100">Your company here</p>
                      <p className="text-xs text-indigo-300/80">Post a job to appear</p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* How it works – timeline */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Simple pipeline</p>
              <h2 className="text-display mt-2 text-3xl font-bold text-gray-900 dark:text-white">How JobPortal works</h2>
            </div>
            <div className="relative mt-16">
              <div className="absolute left-0 top-8 hidden h-0.5 w-full bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 md:block dark:from-indigo-900 dark:via-indigo-600 dark:to-indigo-900" aria-hidden />
              <div className="grid gap-10 md:grid-cols-3 md:gap-6">
                {HOW_IT_WORKS.map(({ step, icon, title, description }, i) => (
                  <div key={title} className="relative">
                    <div className="relative z-10 mx-auto flex max-w-sm flex-col rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-indigo-500/5 ring-1 ring-gray-100/80 transition-all hover:-translate-y-1 hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800 dark:ring-gray-700 motion-reduce:hover:translate-y-0 md:mx-0">
                      <span className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-0.5 text-xs font-bold text-white shadow-md">
                        {step}
                      </span>
                      <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                        {icon}
                      </div>
                      <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{description}</p>
                    </div>
                    {i < 2 && (
                      <div className="my-6 flex justify-center md:hidden" aria-hidden>
                        <div className="h-8 w-px bg-gradient-to-b from-indigo-300 to-transparent dark:from-indigo-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-t border-gray-200 bg-white py-20 dark:border-gray-800 dark:bg-gray-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Social proof</p>
              <h2 className="text-display mt-2 text-3xl font-bold text-gray-900 dark:text-white">Loved by seekers & hiring teams</h2>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {TESTIMONIALS.map(({ quote, author, role, seed }) => (
                <blockquote
                  key={author}
                  className="group relative flex flex-col rounded-3xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 p-8 shadow-lg transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl dark:border-gray-800 dark:from-gray-900 dark:to-gray-900/80 dark:hover:border-indigo-800 motion-reduce:hover:translate-y-0"
                >
                  <div className="mb-4 flex gap-1 text-amber-400" aria-hidden>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="flex-1 text-gray-700 dark:text-gray-300">&ldquo;{quote}&rdquo;</p>
                  <footer className="mt-8 flex items-center gap-4 border-t border-gray-100 pt-6 dark:border-gray-800">
                    <img
                      src={testimonialAvatar(seed)}
                      alt=""
                      className="h-14 w-14 rounded-2xl object-cover ring-2 ring-indigo-100 dark:ring-indigo-900/50"
                      width={56}
                      height={56}
                      loading="lazy"
                    />
                    <div>
                      <cite className="not-italic font-bold text-gray-900 dark:text-white">{author}</cite>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        {!isAuthenticated && (
          <section className="relative overflow-hidden py-20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700" aria-hidden />
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')]"
              aria-hidden
            />
            <div className="pointer-events-none absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-white/20 blur-3xl" aria-hidden />
            <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
              <h2 className="text-display text-3xl font-bold text-white sm:text-4xl">Ready for your next chapter?</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
                Join professionals who use JobPortal to discover roles worth their skills — free for candidates.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-2xl bg-white px-8 py-3.5 text-base font-bold text-indigo-700 shadow-xl transition-all hover:scale-[1.03] hover:shadow-2xl"
                >
                  Create free account
                </Link>
                <Link
                  to="/jobs"
                  className="inline-flex items-center rounded-2xl border-2 border-white/40 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Browse open roles
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  )
}
