import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'   // ← v2 API

// Handlers mínimos para simular API
export const handlers = [
  http.get('http://localhost:3001/api/projects', () => {
    return HttpResponse.json([{ id: 1, name: 'Demo', description: 'OK' }], { status: 200 })
  }),

  http.post('http://localhost:3001/api/projects', async ({ request }) => {
    // si quieres leer el body:
    // const body = await request.json()
    return HttpResponse.json({ id: 2, name: 'Nuevo', description: '' }, { status: 201 })
  }),
]

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
