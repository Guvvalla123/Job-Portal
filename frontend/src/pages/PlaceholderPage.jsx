import { Link, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const PAGES = {
  about: { title: 'About Us', heading: 'About JobPortal', content: 'We connect talented professionals with top employers. Our mission is to make job hunting simple and effective.' },
  careers: { title: 'Careers', heading: 'Work With Us', content: 'Join our team and help build the future of job search. We\'re always looking for talented individuals.' },
  contact: { title: 'Contact', heading: 'Get in Touch', content: 'Have questions? Reach out to us at support@jobportal.com. We typically respond within 24 hours.' },
  press: { title: 'Press', heading: 'Press & Media', content: 'For media inquiries, please contact press@jobportal.com.' },
  privacy: { title: 'Privacy Policy', heading: 'Privacy Policy', content: 'We respect your privacy. Your data is protected and never sold to third parties. We use cookies to improve your experience.' },
  terms: { title: 'Terms of Service', heading: 'Terms of Service', content: 'By using JobPortal, you agree to our terms of service. Please read them carefully.' },
  cookies: { title: 'Cookie Policy', heading: 'Cookie Policy', content: 'We use cookies to improve site functionality and analyze traffic. You can manage your preferences in your browser settings.' },
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
        <title>{page.title} | JobPortal</title>
      </Helmet>
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{page.heading}</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">{page.content}</p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Back to home
        </Link>
      </div>
    </>
  )
}
