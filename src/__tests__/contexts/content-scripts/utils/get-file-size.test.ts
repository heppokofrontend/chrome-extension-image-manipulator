import { afterEach, describe, expect, it, vi } from 'vitest';

const importGetFileSize = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { getFileSize } = await import('@/contexts/content-scripts/utils/get-file-size');

  return { getFileSize };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('getFileSize', () => {
  it('reads size and type from a data URL without touching the network', async () => {
    const { getFileSize } = await importGetFileSize();
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>';

    await expect(getFileSize(img)).resolves.toEqual({
      fileSize: '65 byte',
      fileType: 'image/svg+xml (in HTML)',
    });
  });

  it('falls back to error_fileSize for a data URL when the computed Blob size is falsy', async () => {
    const { getFileSize } = await importGetFileSize();
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    // image.src は常に 'data:image/svg+xml' から始まる非空文字列のため、
    // new Blob([image.src]).size が 0 になるケースは自然には再現できない。
    // size ? ... : getMessage('error_fileSize') の右辺を通すため Blob だけ差し替える
    vi.stubGlobal(
      'Blob',
      vi.fn().mockImplementation(function MockBlob(this: { size: number }) {
        this.size = 0;
      }),
    );

    await expect(getFileSize(img)).resolves.toEqual({
      fileSize: 'error_fileSize',
      fileType: 'image/svg+xml (in HTML)',
    });
  });

  it('falls back to error_fileSize when Content-Length is absent on success', async () => {
    const { getFileSize } = await importGetFileSize();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ headers: new Headers({ 'Content-Type': 'image/png' }) }),
    );
    const img = document.createElement('img');
    img.src = 'https://example.com/foo.png';

    await expect(getFileSize(img)).resolves.toEqual({
      fileSize: 'error_fileSize',
      fileType: 'image/png',
    });
  });

  it('falls back to error_fileType when Content-Type is absent on success', async () => {
    const { getFileSize } = await importGetFileSize();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ headers: new Headers({ 'Content-Length': '1234' }) }),
    );
    const img = document.createElement('img');
    img.src = 'https://example.com/foo.png';

    await expect(getFileSize(img)).resolves.toEqual({
      fileSize: '1234 byte',
      fileType: 'error_fileType',
    });
  });

  it('falls back to error messages when the network request rejects', async () => {
    const { getFileSize } = await importGetFileSize();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const img = document.createElement('img');
    img.src = 'https://example.com/bar.png';

    await expect(getFileSize(img)).resolves.toEqual({
      fileSize: 'error_fileSize',
      fileType: 'error_fileType',
    });
  });
});
