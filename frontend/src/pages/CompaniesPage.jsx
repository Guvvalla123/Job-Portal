import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { queryKeys } from '../lib/queryKeys.js'
import { CACHE_TIERS } from '../lib/queryOptions.js'
import { Link } from 'react-router-dom'
import { apiClient } from '../api/apiClient.js'
import { CompanyCardSkeleton } from '../components/CompanyCardSkeleton.jsx'
import { PageHeader, EmptyState, EmptyStateIcons } from '../components/ui/index.js'

export function CompaniesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filters = { search, page }
  const query = useQuery({
    queryKey: queryKeys.companies.list(filters),
    queryFn: async () => {
      const response = await apiClient.get('/companies', { params: { q: search, page, limit: 12 } })
      return response.data.data
    },
    staleTime: CACHE_TIERS.public.staleTime,
    gcTime: CACHE_TIERS.public.gcTime,
  })

  const companies = query.data?.companies || []
  const pagination = query.data?.pagination || {}
  const totalPages = pagination.totalPages || 1

  return (
    <section className="space-y-6">
      <Helmet>
        <title>Companies | CareerSync</title>
        <meta name="description" content="Explore companies hiring on CareerSync. Find your next employer." />
        <link rel="canonical" href="/companies" />
      </Helmet>
      <PageHeader
        title="Companies"
        description="Explore teams hiring on CareerSync — filter by name to narrow the list."
      />

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200/80 dark:bg-gray-800/90 dark:ring-gray-700/80">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search companies..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm shadow-sm"
          />
        </div>
      </div>

      {query.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <CompanyCardSkeleton key={i} />
          ))}
        </div>
      )}
      {query.isError && <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">Could not load companies.</div>}
      {!query.isLoading && !query.isError && (
      <>
      {companies.length > 0 ? (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Link
            key={String(company.id ?? company._id)}
            to={`/companies/${company.id ?? company._id}`}
            className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 transition-shadow duration-200 hover:shadow-md dark:bg-gray-800/90 dark:ring-gray-700/80"
          >
            {company.logoUrl ? (
              <img src={company.logoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-lg font-semibold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                {company.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900 dark:text-white">{company.name}</h2>
              {company.location && <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{company.location}</p>}
              {company.description && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{company.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-900/40">
          <EmptyState
            icon={EmptyStateIcons.search}
            title="No companies match"
            description={search ? 'Try a different search term or clear filters to see all employers.' : 'No employers are listed yet. Browse open roles instead.'}
            actionLabel={search ? 'Clear search' : 'Browse jobs'}
            {...(search ? { onAction: () => setSearch('') } : { actionHref: '/jobs' })}
          />
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="py-2 text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
      </>
      )}
    </section>
  )
}
