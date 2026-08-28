import { afterEach, describe, expect, it, vi } from 'vitest';

const { setInputValues } = vi.hoisted(() => ({
  setInputValues: vi.fn(),
}));

vi.mock('@/contexts/content-scripts/utils/set-input-values', () => ({
  setInputValues,
}));

const importImageData = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  return import('@/contexts/content-scripts/utils/image-data');
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  setInputValues.mockClear();
});

describe('setImageData', () => {
  it('does nothing when called without an image', async () => {
    const { setImageData } = await importImageData();

    expect(() => setImageData(null as unknown as HTMLImageElement, {})).not.toThrow();
    expect(setInputValues).not.toHaveBeenCalled();
  });

  it('stores the image data without touching the DOM when noNeedInitScreen is true', async () => {
    const { setImageData, getImageData } = await importImageData();
    const img = document.createElement('img');

    setImageData(img, { scale: 42 }, true);

    expect(img.style.transform).toBe('');
    expect(setInputValues).not.toHaveBeenCalled();
    expect(getImageData(img).scale).toBe(42);
  });
});
