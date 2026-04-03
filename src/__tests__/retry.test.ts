import { withRetry } from '../utils/retry';

describe('withRetry', () => {
  it('resolves immediately on success', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { attempts: 3 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, { attempts: 3, delay: 10 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after all attempts exhausted', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));
    await expect(withRetry(fn, { attempts: 3, delay: 10 })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('calls onError callback on each failure', async () => {
    const onError = jest.fn();
    const fn = jest.fn().mockRejectedValue(new Error('err'));
    await expect(withRetry(fn, { attempts: 2, delay: 10, onError })).rejects.toThrow();
    expect(onError).toHaveBeenCalledTimes(2);
  });
});
