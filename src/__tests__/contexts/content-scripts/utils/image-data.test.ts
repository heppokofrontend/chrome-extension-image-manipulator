import { afterEach, describe, expect, it, vi } from 'vitest';

const { renderImageInfo, renderImageController } = vi.hoisted(() => ({
  renderImageInfo: vi.fn(),
  renderImageController: vi.fn(),
}));

vi.mock('@/contexts/content-scripts/components/image-info', () => ({
  renderImageInfo,
}));

vi.mock('@/contexts/content-scripts/components/image-controller', () => ({
  renderImageController,
}));

const importImageData = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  return import('@/contexts/content-scripts/utils/image-data');
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  renderImageInfo.mockClear();
  renderImageController.mockClear();
});

describe('setImageData', () => {
  it('does nothing when called without an image', async () => {
    const { setImageData } = await importImageData();

    expect(() => {
      setImageData({ image: null as unknown as HTMLImageElement, options: {} });
    }).not.toThrow();
    expect(renderImageInfo).not.toHaveBeenCalled();
    expect(renderImageController).not.toHaveBeenCalled();
  });

  it('stores the image data without touching the DOM', async () => {
    const { setImageData, getImageData } = await importImageData();
    const img = document.createElement('img');

    setImageData({ image: img, options: { scale: 42 } });

    expect(img.style.transform).toBe('');
    expect(renderImageInfo).not.toHaveBeenCalled();
    expect(renderImageController).not.toHaveBeenCalled();
    expect(getImageData(img).scale).toBe(42);
  });
});
