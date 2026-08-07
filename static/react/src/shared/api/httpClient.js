import { env } from '@/shared/config';

export class HttpError extends Error {
  constructor(response, body) {
    super(`Request failed with status ${response.status}`);
    this.name = 'HttpError';
    this.status = response.status;
    this.body = body;
    this.response = response;
  }
}

export class NetworkError extends Error {
  constructor(cause) {
    super('Network request failed.');
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

let interceptors = {};

export function configureHttpInterceptors(nextInterceptors) {
  interceptors = nextInterceptors;
  return () => { interceptors = {}; };
}

function toUrl(path) {
  return path.startsWith('http') ? path : `${env.apiBaseUrl}${path}`;
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') ?? '';
  return contentType.includes('application/json') ? response.json() : response.text();
}

async function runErrorInterceptor(error) {
  if (error.status === 401) await interceptors.onUnauthorized?.(error);
  if (error.status === 403) await interceptors.onForbidden?.(error);
}

export async function httpClient(path, options = {}) {
  const { body, headers, ...requestOptions } = options;
  let response;

  try {
    response = await fetch(toUrl(path), {
      credentials: 'same-origin',
      headers: { Accept: 'application/json', ...(body !== undefined && { 'Content-Type': 'application/json' }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...requestOptions,
    });
  } catch (cause) {
    throw new NetworkError(cause);
  }

  const responseBody = await parseResponse(response);
  if (!response.ok) {
    const error = new HttpError(response, responseBody);
    await runErrorInterceptor(error);
    throw error;
  }

  return responseBody;
}
