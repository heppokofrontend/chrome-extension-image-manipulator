import { afterEach, describe, expect, it, vi } from 'vitest';

const { setImageData } = vi.hoisted(() => ({
  setImageData: vi.fn(),
}));

vi.mock('@/contexts/content-scripts/utils/image-data', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/contexts/content-scripts/utils/image-data')>()),
  setImageData,
}));

const importZoomAndScroll = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const [{ zoomAndScrollInit }, { CONTENT_UI }] = await Promise.all([
    import('@/contexts/content-scripts/utils/zoom-and-scroll'),
    import('@/contexts/content-scripts/ui'),
  ]);

  return { zoomAndScrollInit, CONTENT_UI };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  setImageData.mockClear();
});

describe('zoomAndScrollInit', () => {
  it('halves the fit-to-canvas scale when the image would otherwise cover more than half the canvas on init', async () => {
    const { zoomAndScrollInit, CONTENT_UI } = await importZoomAndScroll();

    Object.defineProperty(CONTENT_UI.canvas, 'offsetHeight', { value: 1000, configurable: true });
    Object.defineProperty(CONTENT_UI.canvas, 'offsetWidth', { value: 1000, configurable: true });
    CONTENT_UI.canvas.scroll = vi.fn();

    const img = document.createElement('img');
    Object.defineProperty(img, 'naturalWidth', { value: 10, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 10, configurable: true });

    zoomAndScrollInit(img, 'init');

    expect(setImageData).toHaveBeenCalledWith(img, { scale: 5000 });
  });

  it('fits the image to the canvas without halving when scaleValue is "fit"', async () => {
    const { zoomAndScrollInit, CONTENT_UI } = await importZoomAndScroll();

    Object.defineProperty(CONTENT_UI.canvas, 'offsetHeight', { value: 1000, configurable: true });
    Object.defineProperty(CONTENT_UI.canvas, 'offsetWidth', { value: 1000, configurable: true });
    CONTENT_UI.canvas.scroll = vi.fn();

    const img = document.createElement('img');
    Object.defineProperty(img, 'naturalWidth', { value: 10, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 10, configurable: true });

    zoomAndScrollInit(img, 'fit');

    expect(setImageData).toHaveBeenCalledWith(img, { scale: 9000 });
  });
});
