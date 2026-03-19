import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { queryKeys } from '../lib/queryKeys.js'
import { CACHE_TIERS } from '../lib/queryOptions.js'
import { apiClient } from '../api/apiClient.js'
import { SaveJobButton } from '../components/SaveJobButton.jsx'
import {
  JobCardSkeleton,
  EmptyState,
  EmptyStateIcons,
  Button,
  Input,
  Select,
  Badge,
  Card,
  Sheet,
} from '../components/ui/index.js'

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship']
const EXPERIENCE_LEVELS = ['fresher', 'junior', 'mid', 'senior', 'lead']
const SORT_OPTIONS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'salary-desc', label: 'Salary: High to low' },
  { value: 'salary-asc', label: 'Salary: Low to high' },
]

const TYPE_BADGE_VARIANT = {
  'full-time': 'success',
  'part-time': 'info',
  contract: 'warning',
  internship: 'primary',
}

export function JobsPage() {
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const limit = 10

  const hasActiveFilters = search || location || employmentType || experienceLevel || sort !== 'recent'
  const clearFilters = () => {
    setSearch('')
    setLocation('')
    setEmploymentType('')
    setExperienceLevel('')
    setSort('recent')
    setPage(1)
    setFiltersOpen(false)
  }

  const filters = { search, location, employmentType, experienceLevel, sort, page }
  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs.list(filters),
    queryFn: async () => {
      const params = { q: search, page, limit }
      if (location) params.location = location
      if (employmentType) params.employmentType = employmentType
      if (experienceLevel) params.experienceLevel = experienceLevel
      if (sort && sort !== 'recent') params.sort = sort
      const response = await apiClient.get('/jobs', { params })
      return response.data.data
    },
    staleTime: CACHE_TIERS.public.staleTime,
    gcTime: CACHE_TIERS.public.gcTime,
  })

  const jobs = jobsQuery.data?.jobs || []
  const pagination = jobsQuery.data?.pagination || {}
  const totalPages = pagination.totalPages || 1

  return (
    <section className="space-y-6">
      <Helmet>
        <title>Browse Jobs | JobPortal</title>
        <meta name="description" content="Browse thousands of job listings. Filter by role, location, experience level, and employment type." />
        <link rel="canonical" href="/jobs" />
      </Helmet>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Browse Jobs</h1>
        <p className="mt-1 text-gray-500">
          {pagination.total ? `${pagination.total} jobs found` : 'Find your next opportunity'}
        </p>
      </div>

      {/* Filters — desktop */}
      <Card padding="default" className="hidden lg:block">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder="Search roles, skills..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <Input
            placeholder="Location"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value)
              setPage(1)
            }}
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <Select
            placeholder="All types"
            value={employmentType}
            onChange={(e) => {
              setEmploymentType(e.target.value)
              setPage(1)
            }}
            options={EMPLOYMENT_TYPES.map((t) => ({
              value: t,
              label: t.charAt(0).toUpperCase() + t.slice(1),
            }))}
          />
          <Select
            placeholder="All levels"
            value={experienceLevel}
            onChange={(e) => {
              setExperienceLevel(e.target.value)
              setPage(1)
            }}
            options={EXPERIENCE_LEVELS.map((l) => ({
              value: l,
              label: l.charAt(0).toUpperCase() + l.slice(1),
            }))}
          />
          <div className="flex items-end gap-2">
            <Select
              placeholder="Sort by"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setPage(1)
              }}
              options={SORT_OPTIONS}
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="md" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Mobile filters — button + drawer */}
      <div className="flex items-center gap-2 lg:hidden">
        <Button
          variant="secondary"
          size="md"
          onClick={() => setFiltersOpen(true)}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          }
        >
          Filters {hasActiveFilters && `(${[search, location, employmentType, experienceLevel].filter(Boolean).length + (sort !== 'recent' ? 1 : 0)})`}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Search</label>
            <input
              placeholder="Roles, skills..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Location</label>
            <input
              placeholder="City, remote..."
              value={location}
              onChange={(e) => { setLocation(e.target.value); setPage(1) }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
            />
          </div>
          <Select
            label="Job type"
            placeholder="All types"
            value={employmentType}
            onChange={(e) => { setEmploymentType(e.target.value); setPage(1) }}
            options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
          />
          <Select
            label="Experience"
            placeholder="All levels"
            value={experienceLevel}
            onChange={(e) => { setExperienceLevel(e.target.value); setPage(1) }}
            options={EXPERIENCE_LEVELS.map((l) => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) }))}
          />
          <Select
            label="Sort by"
            placeholder="Sort by"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1) }}
            options={SORT_OPTIONS}
          />
          <Button className="w-full" onClick={() => setFiltersOpen(false)}>
            Apply filters
          </Button>
        </div>
      </Sheet>

      {/* Loading / error */}
      {jobsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : jobsQuery.isError ? (
        <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">Could not load jobs. Please try again.</div>
      ) : (
      <>
      {/* Job cards — responsive grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job._id} hover padding="default" className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/jobs/${job._id}`}
                  className="line-clamp-2 text-base font-semibold text-gray-900 transition-colors hover:text-indigo-600"
                >
                  {job.title}
                </Link>
                <p className="mt-1 text-sm text-gray-500">
                  {job.company?.name} &middot; {job.location}
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
                <Badge variant={TYPE_BADGE_VARIANT[job.employmentType] || 'default'} size="sm">
                  {job.employmentType}
                </Badge>
              )}
              {job.experienceLevel && (
                <Badge variant="default" size="sm">
                  {job.experienceLevel}
                </Badge>
              )}
              {job.createdAt && (
                <span className="text-xs text-gray-400">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {job.skills?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.skills.slice(0, 4).map((skill) => (
                  <Badge key={skill} variant="primary" size="sm">
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 4 && (
                  <span className="text-xs text-gray-400">+{job.skills.length - 4}</span>
                )}
              </div>
            )}
            <div className="mt-auto flex items-center justify-between gap-2 pt-4">
              <Link
                to={`/jobs/${job._id}`}
                className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-500"
              >
                View Details &rarr;
              </Link>
              <SaveJobButton jobId={job._id} />
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {!jobsQuery.isLoading && jobs.length === 0 && (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <EmptyState
            icon={EmptyStateIcons.search}
            title="No jobs found"
            description="Try adjusting your filters or search terms to find more opportunities."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3 pt-6" aria-label="Pagination">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm font-medium text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </nav>
      )}
      </>
      )}
    </section>
  )
}
