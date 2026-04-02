import { z } from 'zod'

export const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  website: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
})

export const jobSchema = z
  .object({
    title: z.string().min(3, 'Job title must be at least 3 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters (API requirement)'),
    location: z.string().min(2, 'Location must be at least 2 characters'),
    employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship']),
    experienceLevel: z.enum(['fresher', 'junior', 'mid', 'senior', 'lead']),
    minSalary: z.coerce.number().min(0, 'Min salary must be 0 or more'),
    maxSalary: z.coerce.number().min(0, 'Max salary must be 0 or more'),
    skills: z.string().optional(),
    companyId: z.string().min(1, 'Please select a company'),
    isDraft: z.boolean().optional(),
    expiresAt: z.string().optional(),
  })
  .refine((d) => d.maxSalary >= d.minSalary, {
    message: 'Max salary must be greater than or equal to min salary',
    path: ['maxSalary'],
  })

export const JOB_DEFAULTS = {
  title: '',
  description: '',
  location: '',
  employmentType: 'full-time',
  experienceLevel: 'junior',
  minSalary: 0,
  maxSalary: 0,
  skills: '',
  companyId: '',
  isDraft: false,
  expiresAt: '',
}

export function toDatetimeLocalValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Normalize Mongo/API id field */
export function entityId(doc) {
  if (!doc) return ''
  return doc.id ?? doc._id ?? ''
}
