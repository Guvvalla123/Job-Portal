import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../context/useAuth.jsx'
import { queryKeys } from '../lib/queryKeys.js'
import { CACHE_TIERS } from '../lib/queryOptions.js'
import { apiClient } from '../api/apiClient.js'
import { SaveJobButton } from '../components/SaveJobButton.jsx'
import { Card, Badge, JobCardSkeleton } from '../components/ui/index.js'

const TYPE_BADGE = { 'full-time': 'success', 'part-time': 'info', contract: 'warning', internship: 'primary' }

const HOW_IT_WORKS = [
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: 'Search & Filter',
    description: 'Search by role, location, experience level, and employment type to find the perfect fit for you.',
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Apply Instantly',
    description: 'Upload your resume, write a cover letter, and apply to jobs with a single click.',
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Track Applications',
    description: 'Monitor your application status in real-time from your personal dashboard.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'Found my dream role in 2 weeks. The platform made it easy to filter and apply to relevant jobs.',
    author: 'Sarah M.',
    role: 'Software Engineer',
    avatar: 'SM',
  },
  {
    quote: 'As a recruiter, I\'ve hired 15+ candidates through JobPortal. Quality applicants and smooth process.',
    author: 'James K.',
    role: 'HR Manager',
    avatar: 'JK',
  },
  {
    quote: 'The resume upload and one-click apply saved me hours. Landed 3 interviews in my first week.',
    author: 'Priya R.',
    role: 'Product Designer',
    avatar: 'PR',
  },
]

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
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
            <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6" aria-hidden="true">
              <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-400 to-blue-600 opacity-20" />
            </div>
          </div>
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100 backdrop-blur-sm">
              Your Career Starts Here
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Find Your Dream Job
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100">
              Connect with top employers, discover opportunities that match your skills, and take the next step in your career — all in one place.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/jobs"
                className="inline-flex items-center rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700"
              >
                Browse Jobs
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-xl border-2 border-white/40 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/70 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700"
                >
                  Create Free Account
                </Link>
              )}
              {user?.role === 'recruiter' && (
                <Link
                  to="/recruiter/dashboard"
                  className="inline-flex items-center rounded-xl border-2 border-white/40 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/70 hover:bg-white/10"
                >
                  Post a Job
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Trust indicators */}
        <section className="border-b border-gray-200 bg-white py-12 dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {jobCount > 0 ? `${jobCount.toLocaleString()}+` : '1,000+'} Jobs
                </p>
                <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">Active listings updated daily</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {companyCount > 0 ? `${companyCount.toLocaleString()}+` : '500+'} Companies
                </p>
                <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">From startups to enterprises</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">Free to Use</p>
                <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">No hidden fees for job seekers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">Smart Matching</p>
                <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">Get recommendations based on your profile</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Jobs */}
        <section className="bg-gray-50 py-16 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Jobs</h2>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Latest opportunities from top companies
                </p>
              </div>
              <Link
                to="/jobs"
                className="shrink-0 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View all jobs →
              </Link>
            </div>

            {featuredJobsQuery.isLoading ? (
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : featuredJobs.length > 0 ? (
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredJobs.map((job) => (
                  <Card key={job._id} hover padding="default" className="flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="line-clamp-2 text-base font-semibold text-gray-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                        >
                          {job.title}
                        </Link>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {job.company?.name} · {job.location}
                        </p>
                      </div>
                      {(job.minSalary > 0 || job.maxSalary > 0) && (
                        <Badge variant="success" size="md" className="shrink-0">
                          ${(job.minSalary || 0).toLocaleString()} – ${(job.maxSalary || 0).toLocaleString()}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {job.employmentType && (
                        <Badge variant={TYPE_BADGE[job.employmentType] || 'default'} size="sm">
                          {job.employmentType}
                        </Badge>
                      )}
                      {job.experienceLevel && (
                        <Badge variant="default" size="sm">{job.experienceLevel}</Badge>
                      )}
                    </div>
                    {job.skills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="primary" size="sm">{skill}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                      <Link
                        to={`/jobs/${job._id}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        View Details →
                      </Link>
                      <SaveJobButton jobId={job._id} />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-xl bg-white p-12 text-center shadow-sm dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">No jobs yet. Check back soon!</p>
                <Link to="/jobs" className="mt-4 inline-block text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Browse jobs
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Top Companies */}
        {companies.length > 0 && (
          <section className="border-t border-gray-200 bg-white py-16 dark:border-gray-700 dark:bg-gray-800">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Top Companies Hiring</h2>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    Explore companies actively hiring on JobPortal
                  </p>
                </div>
                <Link
                  to="/companies"
                  className="shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  View all companies →
                </Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {companies.slice(0, 8).map((company) => (
                  <Link
                    key={company._id}
                    to={`/companies/${company._id}`}
                    className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-blue-800 dark:hover:bg-blue-900/20"
                  >
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-lg font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                        {company.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{company.name}</h3>
                      {company.location && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{company.location}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="bg-gray-50 py-16 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How It Works</h2>
              <p className="mx-auto mt-2 max-w-xl text-gray-600 dark:text-gray-400">
                Three simple steps to land your next opportunity.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {HOW_IT_WORKS.map(({ icon, title, description }, i) => (
                <div
                  key={title}
                  className="relative rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100 transition-shadow hover:shadow-xl dark:bg-gray-800 dark:ring-gray-700"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                    {icon}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{description}</p>
                  {i < 2 && (
                    <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 md:block" aria-hidden="true">
                      <svg className="h-8 w-8 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-white py-16 dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trusted by Job Seekers & Recruiters</h2>
              <p className="mx-auto mt-2 max-w-xl text-gray-600 dark:text-gray-400">
                See what our users say about finding and hiring on JobPortal.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {TESTIMONIALS.map(({ quote, author, role, avatar }) => (
                <blockquote
                  key={author}
                  className="rounded-2xl bg-gray-50 p-8 shadow-sm ring-1 ring-gray-100 dark:bg-gray-700/50 dark:ring-gray-600"
                >
                  <p className="text-gray-700 dark:text-gray-300">&ldquo;{quote}&rdquo;</p>
                  <footer className="mt-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                      {avatar}
                    </div>
                    <div>
                      <cite className="not-italic font-semibold text-gray-900 dark:text-white">{author}</cite>
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
          <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-16 dark:from-gray-950 dark:to-gray-900">
            <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-gray-300">
                Join thousands of professionals who found their dream jobs through our platform.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-500 hover:shadow-xl"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/jobs"
                  className="inline-flex items-center rounded-xl border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:border-white/50 hover:bg-white/10"
                >
                  Browse Jobs
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  )
}
