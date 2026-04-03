import logger from './logger';

interface RetryOptions {
  attempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  onError?: (error: unknown, attempt: number) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { attempts = 3, delay = 1000, backoff = 'exponential', onError } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (onError) onError(error, attempt);

      if (attempt < attempts) {
        const waitMs =
          backoff === 'exponential'
            ? delay * Math.pow(2, attempt - 1)
            : delay * attempt;

        logger.warn(`Retry attempt ${attempt}/${attempts}, waiting ${waitMs}ms`, {
          error: error instanceof Error ? error.message : String(error),
        });

        await sleep(waitMs);
      }
    }
  }

  throw lastError;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
