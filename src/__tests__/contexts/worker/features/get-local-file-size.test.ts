import { afterEach, describe, expect, it, vi } from 'vitest';

const importGetLocalFileSize = async (isAllowedFileSchemeAccess: () => Promise<boolean>) => {
  vi.stubGlobal('chrome', { extension: { isAllowedFileSchemeAccess } });

  const { getLocalFileSize } = await import('@/contexts/worker/features/get-local-file-size');

  return { getLocalFileSize };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('getLocalFileSize', () => {
  it('returns file-access-disabled without fetching when the toggle is off', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { getLocalFileSize } = await importGetLocalFileSize(() => Promise.resolve(false));

    await expect(getLocalFileSize('file:///a.png')).resolves.toEqual({
      ok: false,
      reason: 'file-access-disabled',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves the blob size and type when the toggle is on and fetch succeeds', async () => {
    const blob = { size: 1131170, type: 'image/png' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: () => Promise.resolve(blob) }));
    const { getLocalFileSize } = await importGetLocalFileSize(() => Promise.resolve(true));

    await expect(getLocalFileSize('file:///a.png')).resolves.toEqual({
      ok: true,
      fileSize: 1131170,
      fileType: 'image/png',
    });
  });

  it('returns fetch-failed when fetch rejects even though the toggle is on', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const { getLocalFileSize } = await importGetLocalFileSize(() => Promise.resolve(true));

    await expect(getLocalFileSize('file:///a.png')).resolves.toEqual({
      ok: false,
      reason: 'fetch-failed',
    });
  });
});
