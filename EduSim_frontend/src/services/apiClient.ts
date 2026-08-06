type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  scope?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function createTimeoutSignal(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(new DOMException('Request timeout', 'TimeoutError')), timeoutMs);

  const abortFromParent = () => controller.abort(signal?.reason ?? new DOMException('Aborted', 'AbortError'));

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    } else {
      signal.addEventListener('abort', abortFromParent, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      globalThis.clearTimeout(timer);
      if (signal) {
        signal.removeEventListener('abort', abortFromParent);
      }
    },
  };
}

export function logApiEvent(scope: string, message: string, details?: Record<string, unknown>) {
  console.log(`[${scope}] ${message}`, details || {});
}

export async function fetchJsonWithRetry<T = JsonValue>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    timeoutMs = 45000,
    retries = 1,
    retryDelayMs = 500,
    scope = 'apiClient',
    signal,
    ...init
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const resolvedSignal = signal ?? undefined;
    const timeout = createTimeoutSignal(resolvedSignal, timeoutMs);

    try {
      logApiEvent(scope, 'request:start', { url, attempt: attempt + 1 });
      const response = await fetch(url, { ...init, signal: timeout.signal });
      const raw = await response.text();
      const data = raw ? (JSON.parse(raw) as T) : ({} as T);

      if (!response.ok) {
        const detail = (data as Record<string, unknown>)?.detail;
        let errorMessage = Array.isArray(detail)
          ? detail
              .map((item) => (typeof item === 'object' && item && 'msg' in item ? String((item as Record<string, unknown>).msg) : String(item)))
              .join(', ')
          : detail || (data as Record<string, unknown>)?.error;

        if (!errorMessage) {
          if (response.status === 400) errorMessage = "Invalid request";
          else if (response.status === 401) errorMessage = "Authentication failed";
          else if (response.status === 403) errorMessage = "Access denied";
          else if (response.status === 404) errorMessage = "Resource not found";
          else if (response.status === 409) errorMessage = "User already exists";
          else if (response.status === 422) errorMessage = "Validation failed";
          else if (response.status === 429) errorMessage = "Too many requests";
          else if (response.status >= 500) errorMessage = "Internal server error";
          else errorMessage = `HTTP ${response.status}`;
        }
        if (attempt < retries && isRetryableStatus(response.status)) {
          lastError = new Error(String(errorMessage));
          await sleep(retryDelayMs * (attempt + 1));
          continue;
        }
        throw new Error(String(errorMessage));
      }

      logApiEvent(scope, 'request:success', { url, attempt: attempt + 1 });
      return data;
    } catch (error) {
      lastError = error;
      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      const isTimeout = error instanceof DOMException && error.name === 'TimeoutError';

      if ((isAbort || isTimeout) && resolvedSignal?.aborted) {
        throw error;
      }

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        lastError = new Error("Network error. Check your connection");
      }

      if (attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }

      throw error;
    } finally {
      timeout.cleanup();
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed');
}
