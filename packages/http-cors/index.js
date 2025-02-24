import {normalizeHttpResponse} from '@middy/util';

const getOrigin = (incomingOrigin, options = {}) => {
  if (options.origins.length > 0) {
    if (incomingOrigin && options.origins.includes(incomingOrigin)) {
      return incomingOrigin;
    } else {
      return options.origins[0];
    }
  } else {
    if (incomingOrigin && options.credentials && options.origin === '*') {
      return incomingOrigin;
    }
    return options.origin;
  }
};

const modifyHeaders = (headers, options, request) => {
  const existingHeaders = Object.keys(headers);
  if (existingHeaders.includes('Access-Control-Allow-Credentials')) {
    options.credentials = headers['Access-Control-Allow-Credentials'] === 'true';
  }
  if (options.credentials) {
    headers['Access-Control-Allow-Credentials'] = String(options.credentials);
  }
  if (options.headers && !existingHeaders.includes('Access-Control-Allow-Headers')) {
    headers['Access-Control-Allow-Headers'] = options.headers;
  }
  if (options.methods && !existingHeaders.includes('Access-Control-Allow-Methods')) {
    headers['Access-Control-Allow-Methods'] = options.methods;
  }
  if (!existingHeaders.includes('Access-Control-Allow-Origin')) {
    const eventHeaders = request.event.headers ?? {};
    const incomingOrigin = eventHeaders.Origin ?? eventHeaders.origin;
    headers['Access-Control-Allow-Origin'] = options.getOrigin(incomingOrigin, options);
  }
  let vary = options.vary;
  if (headers['Access-Control-Allow-Origin'] !== '*' && !vary) {
    vary = 'Origin';
  }
  if (vary && !existingHeaders.includes('Vary')) {
    headers.Vary = vary;
  }
  if (options.exposeHeaders && !existingHeaders.includes('Access-Control-Expose-Headers')) {
    headers['Access-Control-Expose-Headers'] = options.exposeHeaders;
  }
  if (options.maxAge && !existingHeaders.includes('Access-Control-Max-Age')) {
    headers['Access-Control-Max-Age'] = String(options.maxAge);
  }
  if (options.requestHeaders && !existingHeaders.includes('Access-Control-Request-Headers')) {
    headers['Access-Control-Request-Headers'] = options.requestHeaders;
  }
  if (options.requestMethods && !existingHeaders.includes('Access-Control-Request-Methods')) {
    headers['Access-Control-Request-Methods'] = options.requestMethods;
  }
  const httpMethod = getVersionHttpMethod[request.event.version ?? '1.0']?.(request.event);
  if (!httpMethod) {
    throw new Error('[http-cors] Unknown http event format');
  }
  if (httpMethod === 'OPTIONS' && options.cacheControl && !existingHeaders.includes('Cache-Control')) {
    headers['Cache-Control'] = options.cacheControl;
  }
}

const defaults = {
  getOrigin,
  credentials: undefined,
  headers: undefined,
  methods: undefined,
  origin: '*',
  origins: [],
  enablePreflightReply: true,
  exposeHeaders: undefined,
  maxAge: undefined,
  requestHeaders: undefined,
  requestMethods: undefined,
  cacheControl: undefined,
  vary: undefined
};
const httpCorsMiddleware = (opts = {}) => {
  const options = {
    ...defaults,
    ...opts
  };
  const httpCorsMiddlewareBefore = async (request) => {
    if (options.enablePreflightReply) {
      if (request.event.httpMethod === "OPTIONS") {
        const {headers} = request.event;
        normalizeHttpResponse(request);
        modifyHeaders(headers, options, request);
        request.response.headers = headers;
        request.response.statusCode = 204
      }
    }
  }

  const httpCorsMiddlewareAfter = async (request) => {
    normalizeHttpResponse(request);
    const {headers} = request.response;
    modifyHeaders(headers, options, request);
    request.response.headers = headers;
  };
  const httpCorsMiddlewareOnError = async (request) => {
    if (request.response === undefined) return;
    return httpCorsMiddlewareAfter(request);
  };
  return {
    before: httpCorsMiddlewareBefore,
    after: httpCorsMiddlewareAfter,
    onError: httpCorsMiddlewareOnError
  };
};
const getVersionHttpMethod = {
  '1.0': (event) => event.httpMethod,
  '2.0': (event) => event.requestContext.http.method
};

export default httpCorsMiddleware;


//# sourceMappingURL=index.js.map
