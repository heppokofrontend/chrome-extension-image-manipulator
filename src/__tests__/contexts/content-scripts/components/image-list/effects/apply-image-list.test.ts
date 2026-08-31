import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { renderImageList, collectImageListEntries } = vi.hoisted(() => ({
  renderImageList: vi.fn(),
  collectImageListEntries: vi.fn(() => []),
}));

vi.mock('@/contexts/content-scripts/components/image-list/renderers', () => ({ renderImageList }));
vi.mock('@/contexts/content-scripts/components/image-list/utils', () => ({
  collectImageListEntries,
}));

const importApplyImageList = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { applyImageList } =
    await import('@/contexts/content-scripts/components/image-list/effects/apply-image-list');
  const { CONTENT_UI } = await import('@/contexts/content-scripts/ui');

  return { applyImageList, CONTENT_UI };
};

const appendButton = (imageList: HTMLElement, current: boolean) => {
  const button = document.createElement('button');
  if (current) {
    button.setAttribute('aria-current', 'true');
  }
  imageList.appendChild(button);
  return button;
};

// isNotVisibleTop/isNotVisibleBottom のどちらも偽になるよう、対象がリスト範囲内に完全に収まる矩形を返す
const stubFullyVisible = (imageList: HTMLElement, current: HTMLElement) => {
  imageList.getBoundingClientRect = () => ({ top: 0, bottom: 100 }) as DOMRect;
  current.getBoundingClientRect = () => ({ top: 10, bottom: 20 }) as DOMRect;
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
  renderImageList.mockReset();
  collectImageListEntries.mockReset().mockReturnValue([]);
});

describe('applyImageList', () => {
  it('does nothing extra when useCache is true and there is no current item', async () => {
    const { applyImageList, CONTENT_UI } = await importApplyImageList();
    appendButton(CONTENT_UI.imageList, false);
    // jsdom は scrollBy を実装していないため、呼び出し検証用に自前で差し込む
    const scrollBy = vi.fn();
    CONTENT_UI.imageList.scrollBy = scrollBy;

    expect(() => {
      applyImageList(true);
    }).not.toThrow();

    vi.runOnlyPendingTimers();
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('does not schedule a scroll adjustment when the current item is already fully visible', async () => {
    const { applyImageList, CONTENT_UI } = await importApplyImageList();
    const current = appendButton(CONTENT_UI.imageList, true);
    stubFullyVisible(CONTENT_UI.imageList, current);
    // jsdom は scrollBy を実装していないため、呼び出し検証用に自前で差し込む
    const scrollBy = vi.fn();
    CONTENT_UI.imageList.scrollBy = scrollBy;

    applyImageList(true);
    vi.runOnlyPendingTimers();

    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('cancels the previously scheduled invisible-timeout on a consecutive non-cached call', async () => {
    const { applyImageList } = await importApplyImageList();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    applyImageList(false);
    expect(clearTimeoutSpy).not.toHaveBeenCalled();

    applyImageList(false);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });
});
