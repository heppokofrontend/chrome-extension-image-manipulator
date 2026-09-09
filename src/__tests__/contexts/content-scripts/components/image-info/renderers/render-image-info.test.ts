import { afterEach, describe, expect, it, vi } from 'vitest';

const importRenderImageInfo = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { initImageInfo, renderImageInfo } =
    await import('@/contexts/content-scripts/components/image-info/renderers/render-image-info');
  const { CONTENT_UI } = await import('@/contexts/content-scripts/ui');
  const { STATE } = await import('@/contexts/content-scripts/state');

  return { initImageInfo, renderImageInfo, CONTENT_UI, STATE };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('initImageInfo', () => {
  it('appends the fields to CONTENT_UI.imageInfo', async () => {
    const { initImageInfo, CONTENT_UI } = await importRenderImageInfo();

    initImageInfo();

    expect(CONTENT_UI.imageInfo.querySelectorAll('input')).toHaveLength(7);
  });
});

describe('renderImageInfo', () => {
  it('does nothing when called before initImageInfo', async () => {
    const { renderImageInfo, CONTENT_UI, STATE } = await importRenderImageInfo();
    const img = document.createElement('img');

    img.src = 'https://example.com/image.png';
    STATE.currentImageElement = img;

    renderImageInfo({ fileSize: '1 KB', fileType: 'png' });

    expect(CONTENT_UI.imageInfo.querySelector<HTMLInputElement>('#url')).toBeNull();
  });

  it('does not update field values when there is no currently tracked image', async () => {
    const { initImageInfo, renderImageInfo, CONTENT_UI, STATE } = await importRenderImageInfo();

    initImageInfo();
    STATE.currentImageElement = null;

    renderImageInfo({ fileSize: '1 KB', fileType: 'png' });

    expect(CONTENT_UI.imageInfo.querySelector<HTMLInputElement>('#url')?.value).toBe('');
  });

  it('writes the tracked image and file data onto the fields', async () => {
    const { initImageInfo, renderImageInfo, CONTENT_UI, STATE } = await importRenderImageInfo();
    const img = document.createElement('img');

    Object.defineProperty(img, 'naturalWidth', { value: 1920 });
    Object.defineProperty(img, 'naturalHeight', { value: 1080 });
    img.src = 'https://example.com/image.png';
    img.alt = 'a photo';
    STATE.currentImageElement = img;

    initImageInfo();
    renderImageInfo({ fileSize: '1 KB', fileType: 'png' });

    const imageInfo = CONTENT_UI.imageInfo;

    expect(imageInfo.querySelector<HTMLInputElement>('#url')?.value).toBe(img.src);
    expect(imageInfo.querySelector<HTMLInputElement>('#alt')?.value).toBe('a photo');
    expect(imageInfo.querySelector<HTMLInputElement>('#size')?.value).toBe('1 KB');
    expect(imageInfo.querySelector<HTMLInputElement>('#type')?.value).toBe('png');
    expect(imageInfo.querySelector<HTMLInputElement>('#natural-width')?.value).toBe('1920 px');
    expect(imageInfo.querySelector<HTMLInputElement>('#natural-height')?.value).toBe('1080 px');
    expect(imageInfo.querySelector<HTMLInputElement>('#aspect')?.value).toBe('16 : 9');
  });

  it('re-renders field values on a second call with new fileData', async () => {
    const { initImageInfo, renderImageInfo, CONTENT_UI, STATE } = await importRenderImageInfo();
    const img = document.createElement('img');

    Object.defineProperty(img, 'naturalWidth', { value: 640 });
    Object.defineProperty(img, 'naturalHeight', { value: 480 });
    STATE.currentImageElement = img;

    initImageInfo();
    renderImageInfo({ fileSize: '1 KB', fileType: 'png' });
    renderImageInfo({ fileSize: '2 KB', fileType: 'jpeg' });

    const imageInfo = CONTENT_UI.imageInfo;

    expect(imageInfo.querySelector<HTMLInputElement>('#size')?.value).toBe('2 KB');
    expect(imageInfo.querySelector<HTMLInputElement>('#type')?.value).toBe('jpeg');
    expect(imageInfo.querySelectorAll('input')).toHaveLength(7);
  });
});
