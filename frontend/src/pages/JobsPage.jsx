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
  Badge,
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
  { value: 'most-clicked', label: 'Most Popular' },
]

const CATEGORY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'design', label: 'Design' },
  { value: 'operations', label: 'Operations' },
  { value: 'human-resources', label: 'Human Resources' },
  { value: 'other', label: 'Other' },
]

const POSTED_WITHIN_OPTIONS = [
  { value: '7days', label: 'Last 7 Days' },
  { value: '3days', label: 'Last 3 Days' },
  { value: 'today', label: 'Today' },
]

const CATEGORY_LABEL = Object.fromEntries(CATEGORY_OPTIONS.map((o) => [o.value, o.label]))
const POSTED_WITHIN_LABEL = Object.fromEntries(POSTED_WITHIN_OPTIONS.map((o) => [o.value, o.label]))

/** Light/dark tokens for Jobs filter inputs (className merges last in Input) */
const JOBS_FILTER_INPUT_CLASS =
  'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-teal-400'

const LEGACY_SORT_MAP = { recent: 'newest', 'salary-desc': 'salary_high', 'salary-asc': 'salary_low' }
const API_SORT_VALUES = new Set(['newest', 'oldest', 'salary_high', 'salary_low', 'most-clicked'])
function coerceSortFromUrl(raw) {
  if (!raw) return 'newest'
  const mapped = LEGACY_SORT_MAP[raw] || raw
  return API_SORT_VALUES.has(mapped) ? mapped : 'newest'
}

function ChipRemoveButton({ label, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
      className="-mr-0.5 ml-0.5 inline-flex rounded-full p-0.5 text-current opacity-70 transition hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/15"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigationType = useNavigationType()

  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') || '')
  const debouncedSearch = useDebouncedValue(searchInput, 320)
  const [location, setLocation] = useState(() => searchParams.get('location') || '')
  const [category, setCategory] = useState(() => searchParams.get('category') || '')
  const [employmentType, setEmploymentType] = useState(() => searchParams.get('employmentType') || '')
  const [experienceLevel, setExperienceLevel] = useState(() => searchParams.get('experienceLevel') || '')
  const [sort, setSort] = useState(() => coerceSortFromUrl(searchParams.get('sort')))
  const [filtersOpen, setFiltersOpen] = useState(false)
  const limit = 10

  useEffect(() => {
    if (navigationType !== 'POP') return
    setSearchInput(searchParams.get('q') || '')
    setLocation(searchParams.get('location') || '')
    setCategory(searchParams.get('category') || '')
    setEmploymentType(searchParams.get('employmentType') || '')
    setExperienceLevel(searchParams.get('experienceLevel') || '')
    const pw = searchParams.get('postedWithin')
    setPostedWithin(pw && ['today', '3days', '7days'].includes(pw) ? pw : '7days')
    setSort(coerceSortFromUrl(searchParams.get('sort')))
  }, [navigationType, searchParams])

  useEffect(() => {
    const next = new URLSearchParams()
    if (debouncedSearch) next.set('q', debouncedSearch)
    if (location) next.set('location', location)
    if (category) next.set('category', category)
    if (employmentType) next.set('employmentType', employmentType)
    if (experienceLevel) next.set('experienceLevel', experienceLevel)
    if (postedWithin && postedWithin !== '7days') next.set('postedWithin', postedWithin)
    if (sort && sort !== 'newest') next.set('sort', sort)
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [
    debouncedSearch,
    location,
    category,
    employmentType,
    experienceLevel,
    postedWithin,
    sort,
    setSearchParams,
    searchParams,
  ])

  const hasActiveFilters =
    debouncedSearch ||
    location ||
    category ||
    employmentType ||
    experienceLevel ||
    postedWithin !== '7days' ||
    sort !== 'newest'

  const clearFilters = () => {
    setSearchInput('')
    setLocation('')
    setCategory('')
    setEmploymentType('')
    setExperienceLevel('')
    setPostedWithin('7days')
    setSort('newest')
    setFiltersOpen(false)
    setSearchParams({}, { replace: true })
  }

  const filterChips = useMemo(() => {
    const chips = []
    if (debouncedSearch.trim()) {
      chips.push({
        key: 'q',
        label: debouncedSearch.trim(),
        remove: () => setSearchInput(''),
      })
    }
    if (location.trim()) {
      chips.push({
        key: 'location',
        label: location.trim(),
        remove: () => setLocation(''),
      })
    }
    if (category) {
      chips.push({
        key: 'category',
        label: CATEGORY_LABEL[category] || category,
        remove: () => setCategory(''),
      })
    }
    if (employmentType) {
      chips.push({
        key: 'employmentType',
        label: employmentType.charAt(0).toUpperCase() + employmentType.slice(1),
        remove: () => setEmploymentType(''),
      })
    }
    if (experienceLevel) {
      chips.push({
        key: 'experienceLevel',
        label: experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1),
        remove: () => setExperienceLevel(''),
      })
    }
    if (postedWithin && postedWithin !== '7days') {
      chips.push({
        key: 'postedWithin',
        label: POSTED_WITHIN_LABEL[postedWithin] || postedWithin,
        remove: () => setPostedWithin('7days'),
      })
    }
    if (sort !== 'newest') {
      const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || sort
      chips.push({
        key: 'sort',
        label: sortLabel,
        remove: () => setSort('newest'),
      })
    }
    return chips
  }, [
    debouncedSearch,
    location,
    category,
    employmentType,
    experienceLevel,
    postedWithin,
    sort,
  ])

  const infiniteFilters = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      location: location || undefined,
      category: category || undefined,
      employmentType: employmentType || undefined,
      experienceLevel: experienceLevel || undefined,
      postedWithin: postedWithin || undefined,
      sort,
      limit,
    }),
    [
      debouncedSearch,
      location,
      category,
      employmentType,
      experienceLevel,
      postedWithin,
      sort,
      limit,
    ],
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

  const activeFilterCount =
    [debouncedSearch, location, category, employmentType, experienceLevel].filter(Boolean).length +
    (postedWithin !== '7days' ? 1 : 0) +
    (sort !== 'newest' ? 1 : 0)

  return (
    <section className="space-y-6">
      <Helmet>
        <title>Browse Jobs | CareerSync</title>
        <meta name="description" content="Browse thousands of job listings. Filter by role, location, experience level, and employment type." />
        <link rel="canonical" href="/jobs" />
      </Helmet>
      <PageHeader title="Browse jobs" />
      <div className="type-body mt-1 max-w-2xl text-slate-600 dark:text-slate-300">
        {jobsQuery.isPending && jobs.length === 0 ? (
          <Skeleton className="h-5 w-44 sm:w-56" />
        ) : pagination.total != null ? (
          `${pagination.total} jobs found`
        ) : (
          'Find your next opportunity'
        )}
      </div>

      {filterChips.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {filterChips.map((chip) => (
              <Badge key={chip.key} variant="primary" size="sm" className="inline-flex max-w-full items-center gap-0.5 pr-1">
                <span className="truncate">{chip.label}</span>
                <ChipRemoveButton label={chip.label} onRemove={chip.remove} />
              </Badge>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" className="shrink-0 self-start sm:self-center" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Mobile / tablet: search + location + open filters */}
      <div className="space-y-4 lg:hidden">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            placeholder="Search roles, skills..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
            }}
            className={JOBS_FILTER_INPUT_CLASS}
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
            className={JOBS_FILTER_INPUT_CLASS}
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            Filters {hasActiveFilters && `(${activeFilterCount})`}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Filters — desktop (lg+) */}
      <Card
        padding="default"
        className="hidden border-gray-200/80 bg-white dark:border-gray-700 dark:bg-gray-900 lg:block"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Input
              placeholder="Search roles, skills..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
              }}
              className={JOBS_FILTER_INPUT_CLASS}
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
              className={JOBS_FILTER_INPUT_CLASS}
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Select
              label="Category"
              placeholder="All Categories"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
              }}
              options={CATEGORY_OPTIONS}
            />
            <Select
              label="Job type"
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
              label="Level"
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
            <Select
              label="Posted Within"
              placeholder=""
              value={postedWithin}
              onChange={(e) => {
                setPostedWithin(e.target.value)
              }}
              options={POSTED_WITHIN_OPTIONS}
            />
            <Select
              label="Sort"
              placeholder="Sort by"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
              }}
              options={SORT_OPTIONS}
            />
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end border-t border-gray-100 pt-3 dark:border-gray-800">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <div className="space-y-4">
          <Select
            label="Category"
            placeholder="All Categories"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
            }}
            options={CATEGORY_OPTIONS}
          />
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
            label="Level"
            placeholder="All levels"
            value={experienceLevel}
            onChange={(e) => {
              setExperienceLevel(e.target.value)
            }}
            options={EXPERIENCE_LEVELS.map((l) => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) }))}
          />
          <Select
            label="Posted Within"
            placeholder=""
            value={postedWithin}
            onChange={(e) => {
              setPostedWithin(e.target.value)
            }}
            options={POSTED_WITHIN_OPTIONS}
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
        <div className="rounded-lg bg-red-50 p-4 text-center text-red-700 dark:bg-red-950/40 dark:text-red-300">
          Could not load jobs. Please try again.
        </div>
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
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900/80 dark:ring-slate-700/80">
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
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {jobs.length} of {pagination.total}
            </p>
          )}
          <div className="flex justify-center">
            <Button
              variant="secondary"
              size="md"
              loading={jobsQuery.isFetchingNextPage}
              loadingText="Loading more jobs..."
              onClick={() => jobsQuery.fetchNextPage()}
              disabled={!jobsQuery.hasNextPage || jobsQuery.isFetchingNextPage}
            >
              Load More Jobs
            </Button>
          </div>
        </div>
      ) : null}
      </>
      )}
    </section>
  )
}
