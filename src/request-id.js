/**
 * Request ID middleware for Hoa.
 *
 * @param {Object} [options]
 * @param {number} [options.limitLength=255] - The maximum length of the request id.
 * @param {string} [options.headerName='X-Request-Id'] - The response header name to expose the id.
 * @param {(ctx: import('hoa').HoaContext) => string} [options.generator] - Custom id generator.
 * @returns {(ctx: import('hoa').HoaContext, next: () => Promise<void>) => Promise<void>} Hoa middleware.
 */
export function requestId (options = {}) {
  const limitLength = options.limitLength ?? 255
  const headerName = options.headerName ?? 'X-Request-Id'
  const generator = options.generator ?? (() => crypto.randomUUID())

  return async function hoaRequestId (ctx, next) {
    // Use incoming header if present and valid
    let reqId = headerName ? ctx.req.get(headerName) : undefined
    if (!reqId || reqId.length > limitLength || /[^\w-]/.test(reqId)) {
      reqId = generator(ctx)
    }

    // Expose to downstream handlers
    ctx.state.requestId = reqId

    try {
      await next()
    } catch (err) {
      const errHeaders = err.headers ? Object.fromEntries(new Headers(err.headers).entries()) : {}
      if (headerName) {
        errHeaders[headerName] = reqId
        err.headers = errHeaders
      } else if (err.headers) {
        // preserve existing error headers when headerName is falsy
        err.headers = errHeaders
      }
      throw err
    } finally {
      if (headerName) {
        ctx.res.set(headerName, reqId)
      }
    }
  }
}

export default requestId
