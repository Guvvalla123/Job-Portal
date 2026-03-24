/** Indian locale: lakh/crore-style grouping (e.g. 6,00,000) */
const LOCALE = 'en-IN'

const opts = { maximumFractionDigits: 0 }

/**
 * @param {number|string|undefined|null} amount
 * @returns {string} e.g. "6,00,000"
 */
export function formatSalaryAmount(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '0'
  return n.toLocaleString(LOCALE, opts)
}

/**
 * @param {number|string|undefined|null} minSalary
 * @param {number|string|undefined|null} maxSalary
 * @returns {string} e.g. "₹6,00,000 – ₹14,00,000"
 */
export function formatSalaryRange(minSalary, maxSalary) {
  return `₹${formatSalaryAmount(minSalary)} – ₹${formatSalaryAmount(maxSalary)}`
}
