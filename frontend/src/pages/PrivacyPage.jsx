import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | CareerSync</title>
        <meta
          name="description"
          content="How CareerSync collects, uses, and retains your personal data when you use our job marketplace."
        />
      </Helmet>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="type-body-sm mt-2 text-gray-500 dark:text-gray-400">Last updated: March 2026</p>

        <div className="type-body mt-8 space-y-8 text-gray-700 dark:text-gray-300">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Who we are</h2>
            <p>
              CareerSync operates a web platform that connects job seekers with employers and recruiters. This policy
              describes how we handle personal information when you use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data we collect</h2>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong className="text-gray-900 dark:text-gray-100">Account and profile:</strong> name, email address,
                and information you add to your profile (such as headline, skills, experience, education, location, and
                phone number if you choose to provide it).
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">Resume and applications:</strong> files and text
                you upload as part of your profile or when you apply to roles (for example, resume PDFs and cover
                letters).
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">Usage and technical data:</strong> IP address,
                device and browser type, pages viewed, and similar diagnostics that help us secure and improve the
                platform.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">How we use your data</h2>
            <ul className="list-inside list-disc space-y-2">
              <li>To create and maintain your account and to authenticate you securely.</li>
              <li>To match you with relevant job listings, alerts, and recommendations based on your profile and activity.</li>
              <li>
                To share application materials with recruiters and employers when you apply to their postings or when
                your profile is visible as part of the hiring process.
              </li>
              <li>To operate, secure, and improve CareerSync, including analytics, fraud prevention, and support.</li>
              <li>To send service-related messages (for example, password resets and important account notices).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Retention</h2>
            <p>
              We keep your information for as long as your account is active or as needed to provide the service,
              comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of
              your account subject to any legal holds or legitimate business needs described in our{' '}
              <Link to="/terms" className="font-medium text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400">
                Terms of Service
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your choices</h2>
            <p>
              You can update or remove much of your profile data from your account settings. For other requests
              (including access or deletion where applicable), contact us using the details on our{' '}
              <Link to="/contact" className="font-medium text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400">
                Contact
              </Link>{' '}
              page.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cookies</h2>
            <p>
              We use cookies and similar technologies for security, preferences, and analytics. See our{' '}
              <Link to="/cookies" className="font-medium text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400">
                Cookie Policy
              </Link>{' '}
              for details.
            </p>
          </section>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            This policy may be updated from time to time. Material changes will be communicated through the platform or
            by email where appropriate.
          </p>

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
