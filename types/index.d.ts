import type { HoaContext } from 'hoa'

export type RequestIdGenerator = (ctx: HoaContext) => string

export interface RequestIdOptions {
  limitLength?: number
  headerName?: string
  generator?: RequestIdGenerator
}

export type RequestIdMiddleware = (ctx: HoaContext, next: () => Promise<void>) => Promise<void>

export function requestId(options?: RequestIdOptions): RequestIdMiddleware

export default requestId
