import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/authHandlers.js'
import { jobHandlers } from './handlers/jobHandlers.js'
import { notificationHandlers } from './handlers/notificationHandlers.js'

export const server = setupServer(...authHandlers, ...jobHandlers, ...notificationHandlers)
