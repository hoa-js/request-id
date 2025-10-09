import { jest } from '@jest/globals'
import Hoa from 'hoa'
import { requestId } from '../src/request-id.js'

function createApp (opts = {}) {
  const app = new Hoa()
  app.use(requestId(opts))

  // Echo the requestId for assertion
  app.use(async (ctx) => {
    ctx.res.body = ctx.state.requestId || 'no-id'
  })

  return app
}

describe('Request ID Middleware for Hoa', () => {
  it('sets X-Request-Id on success and exposes on ctx.state', async () => {
    const app = createApp()
    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(200)
    const id = res.headers.get('x-request-id')
    expect(id).toBeTruthy()
    expect(id).toMatch(/^[\w-]+$/)
    expect(await res.text()).toBe(id)
  })

  it('uses incoming valid header', async () => {
    const app = createApp()
    const req = new Request('http://localhost/', { headers: { 'X-Request-Id': 'abc-123_DEF' } })
    const res = await app.fetch(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('x-request-id')).toBe('abc-123_DEF')
    expect(await res.text()).toBe('abc-123_DEF')
  })

  it('rejects invalid header and uses generated one', async () => {
    const app = createApp()
    const invalid = 'invalid!*'
    const req = new Request('http://localhost/', { headers: { 'X-Request-Id': invalid } })
    const res = await app.fetch(req)
    const id = res.headers.get('x-request-id')
    expect(id).toBeTruthy()
    expect(id).not.toBe(invalid)
    expect(id).toMatch(/^[\w-]+$/)
  })

  it('respects limitLength option', async () => {
    const app = createApp({ limitLength: 5 })
    const provided = '123456'
    const req = new Request('http://localhost/', { headers: { 'X-Request-Id': provided } })
    const res = await app.fetch(req)
    const id = res.headers.get('x-request-id')
    expect(id).toBeTruthy()
    expect(id).not.toBe(provided)
    expect(id).toMatch(/^[\w-]+$/)
  })

  it('uses custom generator when provided', async () => {
    const app = createApp({ generator: () => 'custom-id' })
    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(200)
    expect(res.headers.get('x-request-id')).toBe('custom-id')
    expect(await res.text()).toBe('custom-id')
  })

  it('injects header on error responses', async () => {
    const app = new Hoa()
    app.use(requestId())
    app.use(async (ctx) => {
      ctx.throw(400, 'Bad Request')
    })
    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(400)
    const id = res.headers.get('x-request-id')
    expect(id).toBeTruthy()
  })

  it('skips header read/write when headerName is falsy', async () => {
    const gen = jest.fn(() => 'generated-ctx')
    const app = createApp({ headerName: '', generator: gen })
    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(200)
    // no x-request-id header should be set
    expect(res.headers.get('x-request-id')).toBeNull()
    // body echoes ctx.state.requestId
    expect(await res.text()).toBe('generated-ctx')
    // generator received ctx
    expect(gen).toHaveBeenCalledTimes(1)
    expect(gen.mock.calls[0][0]).toHaveProperty('req')
    expect(gen.mock.calls[0][0]).toHaveProperty('res')
  })

  it('injects header when downstream error carries Headers instance', async () => {
    const app = new Hoa()
    app.use(requestId())
    app.use(async () => {
      const err = new Error('boom')
      err.headers = new Headers({ Foo: 'bar' })
      throw err
    })
    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(500)
    const id = res.headers.get('x-request-id')
    expect(id).toBeTruthy()
    expect(res.headers.get('foo')).toBe('bar')
  })

  it('injects header when downstream error carries plain object headers', async () => {
    const app = new Hoa()
    app.use(requestId())
    app.use(async () => {
      const err = new Error('boom')
      err.headers = { Foo: 'baz' }
      throw err
    })
    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(500)
    const id = res.headers.get('x-request-id')
    expect(id).toBeTruthy()
    expect(res.headers.get('foo')).toBe('baz')
  })

  it('when headerName is falsy and error has no headers, response has no id and no extra headers', async () => {
    const app = new Hoa()
    app.use(requestId({ headerName: '' }))
    app.use(async () => {
      const err = new Error('boom')
      // no err.headers provided
      throw err
    })
    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(500)
    expect(res.headers.get('x-request-id')).toBeNull()
    expect(res.headers.get('foo')).toBeNull()
  })

  it('when headerName is falsy, error response does not include id and preserves error headers', async () => {
    const app = new Hoa()
    app.use(requestId({ headerName: '' }))
    app.use(async () => {
      const err = new Error('boom')
      err.headers = new Headers({ Foo: 'bar' })
      throw err
    })
    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(500)
    expect(res.headers.get('x-request-id')).toBeNull()
    expect(res.headers.get('foo')).toBe('bar')
  })

  it('supports custom headerName', async () => {
    const app = createApp({ headerName: 'X-Correlation-Id' })
    const req = new Request('http://localhost/', { headers: { 'X-Correlation-Id': 'corr-123' } })
    const res = await app.fetch(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('x-correlation-id')).toBe('corr-123')
  })
})
