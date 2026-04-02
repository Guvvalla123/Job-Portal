import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export function CookiesPage() {
  return (
    <>
      <Helmet>
        <title>Cookie Policy | CareerSync</title>
        <meta name="description" content="How CareerSync uses cookies and similar technologies." />
      </Helmet>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Cookie Policy
        </h1>
        <p className="type-body-sm mt-2 text-gray-500 dark:text-gray-400">Last updated: March 2026</p>

        <div className="type-body mt-8 space-y-8 text-gray-700 dark:text-gray-300">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">What are cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. We also use similar
              technologies (such as local storage) where needed for core functionality.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">How we use them</h2>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong className="text-gray-900 dark:text-gray-100">Strictly necessary:</strong> authentication,
                session security, and CSRF protection (including httpOnly cookies set by our API where applicable).
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">Preferences:</strong> remembering choices such as
                theme (light/dark) when you opt in via the site controls.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">Analytics and improvement:</strong> understanding
                how the product is used so we can fix issues and improve performance. Where we use third-party analytics,
                we aim to configure them in a privacy-respecting way consistent with our{' '}
                <Link to="/privacy" className="font-medium text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400">
                  Privacy Policy
                </Link>
                .
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Managing cookies</h2>
            <p>
              You can block or delete cookies through your browser settings. If you disable strictly necessary cookies,
              parts of CareerSync (such as staying signed in) may not work correctly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Updates</h2>
            <p>We may update this Cookie Policy when our practices change. The &ldquo;Last updated&rdquo; date above will reflect revisions.</p>
          </section>

          <Link
            to="/"
            className="inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Back to home
          </Link>
        </div>
      </article>
    </>
  )
}
