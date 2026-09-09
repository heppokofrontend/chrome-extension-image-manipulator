import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getImageData } = vi.hoisted(() => ({
  getImageData: vi.fn(),
}));

vi.mock('@/contexts/content-scripts/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/contexts/content-scripts/utils')>()),
  getImageData,
}));

const importSearchInPage = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { searchInPage } = await import('@/contexts/content-scripts/features/search-in-page');
  const { STATE } = await import('@/contexts/content-scripts/state');
  const { CONTENT_UI } = await import('@/contexts/content-scripts/ui');
  const utils = await import('@/contexts/content-scripts/utils');

  return {
    searchInPage,
    STATE,
    CONTENT_UI,
    convertedImgToSVGMap: utils.convertedImgToSVGMap,
    convertedImgToDummyMap: utils.convertedImgToDummyMap,
  };
};

let restoreScrollIntoView: () => void;

beforeEach(() => {
  const original = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');

  Element.prototype.scrollIntoView = vi.fn();
  restoreScrollIntoView = () => {
    if (original) {
      Object.defineProperty(Element.prototype, 'scrollIntoView', original);
    } else {
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
    }
  };
});

afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  restoreScrollIntoView();
  vi.unstubAllGlobals();
  vi.resetModules();
  getImageData.mockClear();
});

describe('searchInPage', () => {
  it('does nothing when there is no currently tracked image', async () => {
    const { searchInPage, STATE } = await importSearchInPage();
    STATE.currentImageElement = null;

    expect(() => {
      searchInPage();
    }).not.toThrow();

    expect(getImageData).not.toHaveBeenCalled();
  });

  it('does nothing when the tracked image is not inside the dialog', async () => {
    const { searchInPage, STATE, CONTENT_UI } = await importSearchInPage();
    const close = vi.fn();
    CONTENT_UI.dialog.close = close;
    STATE.currentImageElement = document.createElement('img');
    getImageData.mockReturnValue({ isInDialog: false });

    searchInPage();

    expect(close).not.toHaveBeenCalled();
  });

  it('does nothing when the in-dialog image has no recorded origin', async () => {
    const { searchInPage, STATE, CONTENT_UI } = await importSearchInPage();
    const close = vi.fn();
    CONTENT_UI.dialog.close = close;
    STATE.currentImageElement = document.createElement('img');
    getImageData.mockReturnValue({ isInDialog: true, origin: undefined });

    searchInPage();

    expect(close).not.toHaveBeenCalled();
  });

  it('alerts and leaves the dialog open when the origin cannot be resolved to any element on the page', async () => {
    vi.stubGlobal('alert', vi.fn());
    const { searchInPage, STATE, CONTENT_UI } = await importSearchInPage();
    const close = vi.fn();
    CONTENT_UI.dialog.close = close;
    STATE.currentImageElement = document.createElement('img');
    // a detached, non-<img> origin can't be looked up in either conversion map
    const detachedOrigin = document.createElement('div');
    getImageData.mockReturnValue({ isInDialog: true, origin: detachedOrigin });

    searchInPage();

    expect(alert).toHaveBeenCalledWith('searched_image_error');
    expect(close).not.toHaveBeenCalled();
  });

  it('falls back to the converted svg element when the original origin img was replaced', async () => {
    const { searchInPage, STATE, CONTENT_UI, convertedImgToSVGMap } = await importSearchInPage();
    const close = vi.fn();
    CONTENT_UI.dialog.close = close;
    STATE.currentImageElement = document.createElement('img');
    const detachedOrigin = document.createElement('img');
    const replacement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(replacement);
    convertedImgToSVGMap.set(detachedOrigin, replacement);
    getImageData.mockReturnValue({ isInDialog: true, origin: detachedOrigin });

    searchInPage();

    expect(close).toHaveBeenCalledOnce();
  });

  it('falls back to the converted dummy element when there is no svg replacement', async () => {
    const { searchInPage, STATE, CONTENT_UI, convertedImgToDummyMap } = await importSearchInPage();
    const close = vi.fn();
    CONTENT_UI.dialog.close = close;
    STATE.currentImageElement = document.createElement('img');
    const detachedOrigin = document.createElement('img');
    const replacement = document.createElement('img');
    document.body.appendChild(replacement);
    convertedImgToDummyMap.set(detachedOrigin, replacement);
    getImageData.mockReturnValue({ isInDialog: true, origin: detachedOrigin });

    searchInPage();

    expect(close).toHaveBeenCalledOnce();
  });

  it('closes the dialog, focuses immediately, and cleans up the focus point on blur when the origin is visible', async () => {
    const { searchInPage, STATE, CONTENT_UI } = await importSearchInPage();
    const close = vi.fn();
    CONTENT_UI.dialog.close = close;
    STATE.currentImageElement = document.createElement('img');
    const origin = document.createElement('img');
    document.body.appendChild(origin);
    origin.getBoundingClientRect = () => ({ top: 0, left: 0, bottom: 10, right: 10 }) as DOMRect;
    getImageData.mockReturnValue({ isInDialog: true, origin });

    searchInPage();

    expect(close).toHaveBeenCalledOnce();
    expect(document.activeElement?.tagName).toBe('SPAN');
    expect(origin.classList).toHaveLength(1);
    expect(document.querySelectorAll('style')).toHaveLength(1);

    const point = document.activeElement as HTMLElement;
    point.dispatchEvent(new Event('blur'));

    expect(document.body.contains(point)).toBe(false);
    expect(document.querySelectorAll('style')).toHaveLength(0);

    origin.dispatchEvent(new Event('animationend'));
    expect(origin.classList).toHaveLength(0);
  });

  it('treats the origin as invisible when only its right edge overflows the viewport width', async () => {
    const { searchInPage, STATE, CONTENT_UI } = await importSearchInPage();
    CONTENT_UI.dialog.close = vi.fn();
    STATE.currentImageElement = document.createElement('img');
    const origin = document.createElement('img');
    document.body.appendChild(origin);
    // top/left/bottom はすべてビューポート内に収まるが、right だけが innerWidth を超える矩形にする
    origin.getBoundingClientRect = () =>
      ({ top: 0, left: 0, bottom: 10, right: window.innerWidth + 1 }) as DOMRect;
    getImageData.mockReturnValue({ isInDialog: true, origin });

    searchInPage();

    // eslint-disable-next-line @typescript-eslint/unbound-method -- referenced only as a mock call-record, never invoked unbound
    expect(origin.scrollIntoView).toHaveBeenCalledOnce();
    expect(origin.classList).toHaveLength(0);
  });

  it('falls back to document.documentElement.clientWidth when window.innerWidth is falsy', async () => {
    const { searchInPage, STATE, CONTENT_UI } = await importSearchInPage();
    CONTENT_UI.dialog.close = vi.fn();
    STATE.currentImageElement = document.createElement('img');
    const origin = document.createElement('img');
    document.body.appendChild(origin);
    const originalInnerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    Object.defineProperty(window, 'innerWidth', { value: 0, configurable: true });
    // jsdom の documentElement.clientWidth は既定で 0 のため、right>0 なら fallback 分岐でも非表示判定になる
    origin.getBoundingClientRect = () => ({ top: 0, left: 0, bottom: 10, right: 5 }) as DOMRect;
    getImageData.mockReturnValue({ isInDialog: true, origin });

    searchInPage();

    // eslint-disable-next-line @typescript-eslint/unbound-method -- referenced only as a mock call-record, never invoked unbound
    expect(origin.scrollIntoView).toHaveBeenCalledOnce();
    expect(origin.classList).toHaveLength(0);

    if (originalInnerWidth) {
      Object.defineProperty(window, 'innerWidth', originalInnerWidth);
    }
  });

  it('scrolls the origin into view and focuses it once scrolling settles when it is off-screen', async () => {
    const { searchInPage, STATE, CONTENT_UI } = await importSearchInPage();
    CONTENT_UI.dialog.close = vi.fn();
    STATE.currentImageElement = document.createElement('img');
    const origin = document.createElement('img');
    document.body.appendChild(origin);
    origin.getBoundingClientRect = () =>
      ({ top: -100, left: 0, bottom: -50, right: 10 }) as DOMRect;
    getImageData.mockReturnValue({ isInDialog: true, origin });

    searchInPage();

    // eslint-disable-next-line @typescript-eslint/unbound-method -- referenced only as a mock call-record, never invoked unbound
    expect(origin.scrollIntoView).toHaveBeenCalledOnce();
    expect(origin.classList).toHaveLength(0);

    window.dispatchEvent(new Event('scrollend'));

    expect(document.activeElement?.tagName).toBe('SPAN');
    expect(origin.classList).toHaveLength(1);
  });
});
