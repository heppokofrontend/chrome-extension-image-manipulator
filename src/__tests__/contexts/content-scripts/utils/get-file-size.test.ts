import { afterEach, describe, expect, it, vi } from 'vitest';

const importGetFileSize = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { createGetFileSize } = await import('@/contexts/content-scripts/utils/get-file-size');

  return { createGetFileSize };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('createGetFileSize', () => {
  it('reads size and type from a data URL without touching the network', async () => {
    const { createGetFileSize } = await importGetFileSize();
    const setImageData = vi.fn();
    const getFileSize = createGetFileSize({ setImageData });
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>';

    await getFileSize(img);

    expect(setImageData).toHaveBeenCalledWith(img, {
      fileSize: '65 byte',
      fileType: 'image/svg+xml (in HTML)',
    });
  });

  it('falls back to error_fileSize when Content-Length is absent on success', async () => {
    const { createGetFileSize } = await importGetFileSize();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ headers: new Headers({ 'Content-Type': 'image/png' }) }),
    );
    const setImageData = vi.fn();
    const getFileSize = createGetFileSize({ setImageData });
    const img = document.createElement('img');
    img.src = 'https://example.com/foo.png';

    await getFileSize(img);

    expect(setImageData).toHaveBeenCalledWith(img, {
      fileSize: 'error_fileSize',
      fileType: 'image/png',
    });
  });

  it('falls back to error_fileType when Content-Type is absent on success', async () => {
    const { createGetFileSize } = await importGetFileSize();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ headers: new Headers({ 'Content-Length': '1234' }) }),
    );
    const setImageData = vi.fn();
    const getFileSize = createGetFileSize({ setImageData });
    const img = document.createElement('img');
    img.src = 'https://example.com/foo.png';

    await getFileSize(img);

    expect(setImageData).toHaveBeenCalledWith(img, {
      fileSize: '1234 byte',
      fileType: 'error_fileType',
    });
  });

  it('falls back to error messages when the network request rejects', async () => {
    const { createGetFileSize } = await importGetFileSize();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const setImageData = vi.fn();
    const getFileSize = createGetFileSize({ setImageData });
    const img = document.createElement('img');
    img.src = 'https://example.com/bar.png';

    await getFileSize(img);

    expect(setImageData).toHaveBeenCalledWith(img, {
      fileSize: 'error_fileSize',
      fileType: 'error_fileType',
    });
  });
});
