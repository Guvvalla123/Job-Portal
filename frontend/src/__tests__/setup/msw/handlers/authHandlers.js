import { http, HttpResponse } from 'msw'

const BASE = '/api/v1'

export const authHandlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json()
    if (body.email === 'test@test.com' && body.password === 'Test@1234') {
      return HttpResponse.json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: 'mock-access-token',
          csrfToken: 'mock-csrf-token',
          user: {
            id: 'user-123',
            fullName: 'Test User',
            email: 'test@test.com',
            role: 'candidate',
          },
        },
      })
    }
    return HttpResponse.json(
      {
        success: false,
        message: 'Invalid credentials',
        code: 'UNAUTHORIZED',
      },
      { status: 401 },
    )
  }),

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = await request.json()
    if (!body.email || !body.password) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Validation failed',
          code: 'VALIDATION_FAILED',
          errors: [{ field: 'email', message: 'Required' }],
        },
        { status: 422 },
      )
    }
    return HttpResponse.json(
      {
        success: true,
        message: 'Registered successfully',
        data: {
          accessToken: 'mock-token',
          user: {
            id: 'new-user-123',
            fullName: body.fullName,
            email: body.email,
            role: body.role || 'candidate',
          },
        },
      },
      { status: 201 },
    )
  }),

  http.post(`${BASE}/auth/logout`, () => new HttpResponse(null, { status: 204 })),

  http.post(`${BASE}/auth/refresh`, () =>
    HttpResponse.json({
      success: true,
      data: {
        accessToken: 'new-mock-token',
        csrfToken: 'new-mock-csrf',
      },
    }),
  ),

  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({
      success: true,
      data: {
        user: {
          id: 'user-123',
          fullName: 'Test User',
          email: 'test@test.com',
          role: 'candidate',
        },
      },
    }),
  ),

  http.get(`${BASE}/auth/csrf-token`, () =>
    HttpResponse.json({
      success: true,
      data: { csrfToken: 'mock-csrf-token' },
    }),
  ),
]
