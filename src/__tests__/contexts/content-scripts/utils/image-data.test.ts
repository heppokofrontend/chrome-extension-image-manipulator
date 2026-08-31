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
      setImageData(null as unknown as HTMLImageElement, {});
    }).not.toThrow();
    expect(renderImageInfo).not.toHaveBeenCalled();
    expect(renderImageController).not.toHaveBeenCalled();
  });

  it('stores the image data without touching the DOM when noNeedInitScreen is true', async () => {
    const { setImageData, getImageData } = await importImageData();
    const img = document.createElement('img');

    setImageData(img, { scale: 42 }, true);

    expect(img.style.transform).toBe('');
    expect(renderImageInfo).not.toHaveBeenCalled();
    expect(renderImageController).not.toHaveBeenCalled();
    expect(getImageData(img).scale).toBe(42);
  });

  it('rebuilds the in-dialog cssText without a "null" prefix when getAttribute("style") returns null', async () => {
    const { setImageData } = await importImageData();
    const { CONTENT_UI } = await import('@/contexts/content-scripts/ui');
    const img = document.createElement('img');
    // 実運用では line 62 の img.style.transform 代入が先に走って style 属性が必ず作られるため、
    // getAttribute('style') が null を返すケースは自然には再現できない。?? '' の右辺を通すために
    // getAttribute だけを差し替える
    vi.spyOn(img, 'getAttribute').mockReturnValue(null);
    // jsdom は Element.scroll を実装していないため直接差し込む
    CONTENT_UI.canvas.scroll = vi.fn();

    setImageData(img, { isInDialog: true, scale: 100, oldScale: 100 });

    expect(img.style.cssText.startsWith('null')).toBe(false);
    expect(renderImageInfo).toHaveBeenCalledOnce();
    expect(renderImageController).toHaveBeenCalledOnce();
  });
});
