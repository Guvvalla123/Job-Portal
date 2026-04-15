import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SUPPORT_EMAIL } from '../config/site.js'

export function ContactPage() {
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('CareerSync — inquiry')}`

  return (
    <>
      <Helmet>
        <title>Contact | CareerSync</title>
        <meta
          name="description"
          content="Contact CareerSync for help with your account, hiring on the platform, or general questions."
        />
      </Helmet>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Contact</h1>
        <p className="type-body-sm mt-2 text-gray-500 dark:text-gray-400">
          We are here to help with account issues, employer onboarding, and general questions about CareerSync.
        </p>

        <div className="type-body mt-8 space-y-8 text-gray-700 dark:text-gray-300">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email</h2>
            <p>
              For the fastest response, write to{' '}
              <a
                href={mailto}
                className="font-medium text-teal-700 underline hover:text-[#0C5F5A] dark:text-teal-400"
              >
                {SUPPORT_EMAIL}
              </a>
              . Please include your registered email address if the request is about an existing account.
            </p>
            <p className="type-body-sm text-gray-600 dark:text-gray-400">
              Typical response time: within <strong className="text-gray-800 dark:text-gray-200">24 hours</strong> on
              business days (often sooner).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Before you write</h2>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong className="text-gray-900 dark:text-gray-100">Password or login:</strong> try{' '}
                <Link
                  to="/forgot-password"
                  className="font-medium text-teal-700 underline hover:text-[#0C5F5A] dark:text-teal-400"
                >
                  Forgot password
                </Link>{' '}
                first—it is the quickest path back into your account.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">Privacy &amp; data:</strong> see our{' '}
                <Link to="/privacy" className="font-medium text-teal-700 underline hover:text-[#0C5F5A] dark:text-teal-400">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link to="/terms" className="font-medium text-teal-700 underline hover:text-[#0C5F5A] dark:text-teal-400">
                  Terms of Service
                </Link>
                .
              </li>
            </ul>
          </section>

          <section className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900/40">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Learn more</h2>
            <p className="type-body-sm">
              New to the platform? Read{' '}
              <Link to="/about" className="font-medium text-teal-700 underline hover:text-[#0C5F5A] dark:text-teal-400">
                About CareerSync
              </Link>{' '}
              for an overview of what we offer candidates and recruiters.
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
