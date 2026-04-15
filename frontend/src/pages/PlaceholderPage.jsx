import { Link, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const PAGES = {
  careers: { title: 'Careers', heading: 'Work With Us', content: 'Join our team and help build the future of job search. We\'re always looking for talented individuals.' },
  press: { title: 'Press', heading: 'Press & Media', content: 'For media inquiries, please contact press@careersync.com.' },
  'resources/career-tips': { title: 'Career Tips', heading: 'Career Tips', content: 'Expert advice on resumes, interviews, and career growth. Coming soon.' },
  'resources/resume': { title: 'Resume Builder', heading: 'Resume Builder', content: 'Build a professional resume in minutes. Coming soon.' },
  'resources/interview': { title: 'Interview Prep', heading: 'Interview Preparation', content: 'Prepare for your next interview with our guides. Coming soon.' },
}

export function PlaceholderPage() {
  const { pathname } = useLocation()
  const path = pathname.replace(/^\//, '')
  const page = PAGES[path] || { title: 'Page', heading: 'Page', content: 'This page is under construction.' }

  return (
    <>
      <Helmet>
        <title>{page.title} | CareerSync</title>
      </Helmet>
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {page.heading}
        </h1>
        <p className="type-body mt-4">{page.content}</p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-lg bg-teal-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0C5F5A]"
        >
          Back to home
        </Link>
      </div>
    </>
  )
}
