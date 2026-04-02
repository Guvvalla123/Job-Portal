import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useNavigationType, useSearchParams } from 'react-router-dom'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'
import { queryKeys } from '../lib/queryKeys.js'
import { CACHE_TIERS } from '../lib/queryOptions.js'
import { listPublicJobs } from '../api/jobsApi.js'
import { filterPublicJobs } from '../utils/filterPublicJobs.js'
import {
  JobCardSkeleton,
  Skeleton,
  EmptyState,
  EmptyStateIcons,
  Button,
  Input,
  Select,
  Card,
  Sheet,
  PageHeader,
} from '../components/ui/index.js'
import { JobListCard } from '../components/jobs/JobListCard.jsx'

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship']
const EXPERIENCE_LEVELS = ['fresher', 'junior', 'mid', 'senior', 'lead']
/** Must match backend `listJobsQuerySchema` sort enum */
const SORT_OPTIONS = [
  { value: 'newest', label: 'Most recent' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'salary_high', label: 'Salary: High to low' },
  { value: 'salary_low', label: 'Salary: Low to high' },
]

const LEGACY_SORT_MAP = { recent: 'newest', 'salary-desc': 'salary_high', 'salary-asc': 'salary_low' }
const API_SORT_VALUES = new Set(['newest', 'oldest', 'salary_high', 'salary_low'])
function coerceSortFromUrl(raw) {
  if (!raw) return 'newest'
  const mapped = LEGACY_SORT_MAP[raw] || raw
  return API_SORT_VALUES.has(mapped) ? mapped : 'newest'
}

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigationType = useNavigationType()

  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') || '')
  const debouncedSearch = useDebouncedValue(searchInput, 320)
  const [location, setLocation] = useState(() => searchParams.get('location') || '')
  const [employmentType, setEmploymentType] = useState(() => searchParams.get('employmentType') || '')
  const [experienceLevel, setExperienceLevel] = useState(() => searchParams.get('experienceLevel') || '')
  const [sort, setSort] = useState(() => coerceSortFromUrl(searchParams.get('sort')))
  const [filtersOpen, setFiltersOpen] = useState(false)
  const limit = 10

  useEffect(() => {
    if (navigationType !== 'POP') return
    setSearchInput(searchParams.get('q') || '')
    setLocation(searchParams.get('location') || '')
    setEmploymentType(searchParams.get('employmentType') || '')
    setExperienceLevel(searchParams.get('experienceLevel') || '')
    setSort(coerceSortFromUrl(searchParams.get('sort')))
  }, [navigationType, searchParams])

  useEffect(() => {
    const next = new URLSearchParams()
    if (debouncedSearch) next.set('q', debouncedSearch)
    if (location) next.set('location', location)
    if (employmentType) next.set('employmentType', employmentType)
    if (experienceLevel) next.set('experienceLevel', experienceLevel)
    if (sort && sort !== 'newest') next.set('sort', sort)
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [debouncedSearch, location, employmentType, experienceLevel, sort, setSearchParams, searchParams])

  const hasActiveFilters =
    debouncedSearch || location || employmentType || experienceLevel || sort !== 'newest'
  const clearFilters = () => {
    setSearchInput('')
    setLocation('')
    setEmploymentType('')
    setExperienceLevel('')
    setSort('newest')
    setFiltersOpen(false)
    setSearchParams({}, { replace: true })
  }

  const infiniteFilters = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      location: location || undefined,
      employmentType: employmentType || undefined,
      experienceLevel: experienceLevel || undefined,
      sort,
      limit,
    }),
    [debouncedSearch, location, employmentType, experienceLevel, sort, limit],
  )

  const jobsQuery = useInfiniteQuery({
    queryKey: queryKeys.jobs.infiniteList(infiniteFilters),
    queryFn: ({ pageParam }) =>
      listPublicJobs({
        page: pageParam,
        limit,
        ...infiniteFilters,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const p = lastPage?.pagination?.page ?? 1
      const totalPages = lastPage?.pagination?.totalPages ?? 0
      if (p < totalPages) return p + 1
      return undefined
    },
    staleTime: CACHE_TIERS.public.staleTime,
    gcTime: CACHE_TIERS.public.gcTime,
  })

  const jobs = filterPublicJobs(jobsQuery.data?.pages.flatMap((p) => p.jobs ?? []) ?? [])
  const firstPage = jobsQuery.data?.pages[0]
  const pagination = firstPage?.pagination || {}

  return (
    <section className="space-y-6">
      <Helmet>
        <title>Browse Jobs | CareerSync</title>
        <meta name="description" content="Browse thousands of job listings. Filter by role, location, experience level, and employment type." />
        <link rel="canonical" href="/jobs" />
      </Helmet>
      <PageHeader title="Browse jobs" />
      <div className="type-body mt-1 max-w-2xl text-gray-600 dark:text-gray-400">
        {jobsQuery.isPending && jobs.length === 0 ? (
          <Skeleton className="h-5 w-44 sm:w-56" />
        ) : pagination.total != null ? (
          `${pagination.total} jobs found`
        ) : (
          'Find your next opportunity'
        )}
      </div>

      {/* Filters — desktop */}
      <Card padding="default" className="hidden lg:block">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder="Search roles, skills..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
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
          Filters{' '}
          {hasActiveFilters &&
            `(${[debouncedSearch, location, employmentType, experienceLevel].filter(Boolean).length + (sort !== 'newest' ? 1 : 0)})`}
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
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
              }}
              className="w-full min-h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Location</label>
            <input
              placeholder="City, remote..."
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
            />
          </div>
          <Select
            label="Job type"
            placeholder="All types"
            value={employmentType}
            onChange={(e) => {
              setEmploymentType(e.target.value)
            }}
            options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
          />
          <Select
            label="Experience"
            placeholder="All levels"
            value={experienceLevel}
            onChange={(e) => {
              setExperienceLevel(e.target.value)
            }}
            options={EXPERIENCE_LEVELS.map((l) => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) }))}
          />
          <Select
            label="Sort by"
            placeholder="Sort by"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
            }}
            options={SORT_OPTIONS}
          />
          <Button className="w-full" onClick={() => setFiltersOpen(false)}>
            Apply filters
          </Button>
        </div>
      </Sheet>

      {/* Loading / error */}
      {jobsQuery.isPending && jobs.length === 0 ? (
        <div className="grid min-h-96 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          <JobListCard key={job.id ?? job._id} job={job} />
        ))}
      </div>

      {/* Empty state */}
      {!jobsQuery.isPending && !jobsQuery.isFetchingNextPage && jobs.length === 0 && (
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

      {jobsQuery.hasNextPage && jobs.length > 0 ? (
        <div className="flex flex-col items-center gap-2 pt-6">
          {pagination.total != null && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {jobs.length} of {pagination.total}
            </p>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => jobsQuery.fetchNextPage()}
            disabled={jobsQuery.isFetchingNextPage}
          >
            {jobsQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      ) : null}
      </>
      )}
    </section>
  )
}
