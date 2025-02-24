import middy from '@middy/core'

export interface Options {
  getOrigin?: (incomingOrigin: string, options: Options) => string
  credentials?: boolean | string
  enablePreflightReply: true,
  headers?: string
  methods?: string
  origin?: string
  origins?: string[]
  exposeHeaders?: string
  maxAge?: number | string
  requestHeaders?: string
  requestMethods?: string
  cacheControl?: string
}

declare function httpCors (options?: Options): middy.MiddlewareObj

export default httpCors
