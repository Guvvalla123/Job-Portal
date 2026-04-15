import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About Us | CareerSync</title>
        <meta
          name="description"
          content="Learn about CareerSync — how we connect job seekers with employers and what we stand for."
        />
      </Helmet>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">About Us</h1>
        <p className="type-body-sm mt-2 text-gray-500 dark:text-gray-400">
          The modern marketplace for people who hire and people who want to be hired.
        </p>

        <div className="type-body mt-8 space-y-8 text-gray-700 dark:text-gray-300">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Our mission</h2>
            <p>
              CareerSync exists to make hiring and job searching faster and fairer. We give candidates clear job discovery,
              polished profiles, and a straightforward way to apply—while giving recruiters and employers the tools to
              post roles, manage applicants, and run a professional pipeline in one place.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">What you can do here</h2>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong className="text-gray-900 dark:text-gray-100">Candidates:</strong> search and save jobs, build a
                rich profile, upload a resume, apply with confidence, and get notified when things change.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">Recruiters:</strong> showcase your company, publish
                and manage listings, review applications, and collaborate on status, notes, and interviews.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">Trust &amp; safety:</strong> role-based access,
                secure authentication, and audit-friendly admin tools help keep the platform dependable for everyone.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Get in touch</h2>
            <p>
              Questions about CareerSync or your account?{' '}
              <Link to="/contact" className="font-medium text-teal-700 underline hover:text-[#0C5F5A] dark:text-teal-400">
                Visit our contact page
              </Link>{' '}
              — we aim to reply to most messages within one business day.
            </p>
          </section>
        </div>

        <p className="type-body-sm mt-10">
          <Link
            to="/"
            className="font-medium text-teal-700 underline hover:text-[#0C5F5A] dark:text-teal-400"
          >
            ← Back to home
          </Link>
        </p>
      </article>
    </>
  )
}
