/**
 * Replaces placeholder domain in sitemap.xml and robots.txt at build time.
 * Uses VITE_SITE_URL from env. Run before build: VITE_SITE_URL=https://yoursite.com node scripts/replace-seo-domain.js
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const domain = process.env.VITE_SITE_URL || 'https://jobportal.example.com'
const placeholder = 'https://jobportal.example.com'

;[ 'sitemap.xml', 'robots.txt' ].forEach((file) => {
  const path = join(publicDir, file)
  try {
    let content = readFileSync(path, 'utf8')
    const baseUrl = domain.replace(/\/$/, '')
    content = content.replaceAll(placeholder, baseUrl)
    writeFileSync(path, content)
    console.log(`Updated ${file} with domain: ${domain}`)
  } catch (err) {
    console.warn(`Could not update ${file}:`, err.message)
  }
})
