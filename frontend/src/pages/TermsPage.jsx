import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | CareerSync</title>
        <meta name="description" content="Terms governing your use of the CareerSync job marketplace." />
      </Helmet>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="type-body-sm mt-2 text-gray-500 dark:text-gray-400">Last updated: March 2026</p>

        <div className="type-body mt-8 space-y-8 text-gray-700 dark:text-gray-300">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Agreement</h2>
            <p>
              By accessing or using CareerSync, you agree to these Terms and our{' '}
              <Link to="/privacy" className="font-medium text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400">
                Privacy Policy
              </Link>
              . If you do not agree, do not use the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">The service</h2>
            <p>
              CareerSync provides tools to discover jobs, manage a professional profile, apply to roles, and (for
              authorized users) post and manage listings. We may modify, suspend, or discontinue features with
              reasonable notice where practicable.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Accounts</h2>
            <p>
              You must provide accurate registration information and keep your credentials confidential. You are
              responsible for activity under your account. We may suspend or terminate accounts that violate these
              Terms, misuse the platform, or pose a security risk.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Acceptable use</h2>
            <ul className="list-inside list-disc space-y-2">
              <li>Do not post false, misleading, or discriminatory job listings or profile content.</li>
              <li>Do not scrape, overload, or attempt to circumvent security or rate limits.</li>
              <li>Do not use CareerSync to send spam, malware, or harassing communications.</li>
              <li>Respect intellectual property and confidentiality obligations in materials you upload or share.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Employers and recruiters</h2>
            <p>
              Listings and hiring decisions are your responsibility. CareerSync does not guarantee hires, applicant
              quality, or outcomes. You agree to comply with applicable employment and data-protection laws when
              processing candidate data obtained through the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Disclaimers</h2>
            <p>
              The service is provided &ldquo;as is&rdquo; to the fullest extent permitted by law. We disclaim warranties
              of merchantability, fitness for a particular purpose, and non-infringement except where such disclaimers
              are not legally permitted.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, CareerSync and its affiliates will not be liable for indirect,
              incidental, special, consequential, or punitive damages, or for loss of profits or data, arising from your
              use of the service. Our aggregate liability for claims relating to the service is limited to the greater
              of amounts you paid us in the twelve months before the claim or one hundred dollars (USD), except where
              liability cannot be limited by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contact</h2>
            <p>
              Questions about these Terms? Reach out via our{' '}
              <Link to="/contact" className="font-medium text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400">
                Contact
              </Link>{' '}
              page.
            </p>
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
