import { http, HttpResponse } from 'msw'

const BASE = '/api/v1'

const mockJob = {
  id: 'job-123',
  title: 'Software Engineer',
  description: 'A great job',
  location: 'Hyderabad',
  employmentType: 'full-time',
  minSalary: 500000,
  maxSalary: 1000000,
  company: {
    id: 'company-123',
    name: 'Tech Corp',
    logoUrl: null,
  },
  isActive: true,
  isDraft: false,
  createdAt: new Date().toISOString(),
}

export const jobHandlers = [
  http.get(`${BASE}/jobs`, () =>
    HttpResponse.json({
      success: true,
      data: {
        jobs: [mockJob],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    }),
  ),

  http.get(`${BASE}/jobs/:id`, ({ params }) => {
    if (params.id === 'job-123') {
      return HttpResponse.json({
        success: true,
        data: { job: mockJob },
      })
    }
    return HttpResponse.json(
      {
        success: false,
        message: 'Job not found',
      },
      { status: 404 },
    )
  }),

  http.post(`${BASE}/applications`, () =>
    HttpResponse.json(
      {
        success: true,
        message: 'Applied successfully',
        data: {
          application: {
            id: 'app-123',
            status: 'applied',
          },
        },
      },
      { status: 201 },
    ),
  ),
]
