import { http, HttpResponse } from 'msw'

const BASE = '/api/v1'

export const notificationHandlers = [
  http.get(`${BASE}/notifications`, () =>
    HttpResponse.json({
      success: true,
      data: {
        notifications: [
          {
            id: 'notif-1',
            type: 'APPLICATION_RECEIVED',
            title: 'New application',
            message: 'Someone applied',
            read: false,
            createdAt: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
        total: 1,
        page: 1,
        totalPages: 1,
      },
    }),
  ),

  http.get(`${BASE}/notifications/unread-count`, () =>
    HttpResponse.json({
      success: true,
      data: { count: 3 },
    }),
  ),

  http.patch(`${BASE}/notifications/read-all`, () =>
    HttpResponse.json({
      success: true,
      message: 'All marked as read',
    }),
  ),

  http.patch(`${BASE}/notifications/:id/read`, () =>
    HttpResponse.json({
      success: true,
      data: { notification: { read: true } },
    }),
  ),

  http.delete(`${BASE}/notifications/:id`, () =>
    HttpResponse.json({
      success: true,
      message: 'Deleted',
    }),
  ),
]
