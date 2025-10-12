import type { HoaContext, HoaMiddleware } from 'hoa'

export type RequestIdGenerator = (ctx: HoaContext) => string

export interface RequestIdOptions {
  limitLength?: number
  headerName?: string
  generator?: RequestIdGenerator
}

export function requestId(options?: RequestIdOptions): HoaMiddleware

export default requestId
