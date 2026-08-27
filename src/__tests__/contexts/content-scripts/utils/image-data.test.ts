import { afterEach, describe, expect, it, vi } from 'vitest';

const importImageData = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  return import('@/contexts/content-scripts/utils/image-data');
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('createSetImageData', () => {
  it('does nothing when called without an image', async () => {
    const { createSetImageData } = await importImageData();
    const setInputValues = vi.fn();
    const setImageData = createSetImageData({ setInputValues });

    expect(() => setImageData(null as unknown as HTMLImageElement, {})).not.toThrow();
    expect(setInputValues).not.toHaveBeenCalled();
  });

  it('stores the image data without touching the DOM when noNeedInitScreen is true', async () => {
    const { createSetImageData, getImageData } = await importImageData();
    const setInputValues = vi.fn();
    const setImageData = createSetImageData({ setInputValues });
    const img = document.createElement('img');

    setImageData(img, { scale: 42 }, true);

    expect(img.style.transform).toBe('');
    expect(setInputValues).not.toHaveBeenCalled();
    expect(getImageData(img).scale).toBe(42);
  });
});
