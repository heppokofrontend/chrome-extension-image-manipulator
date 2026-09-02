import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  applyImageList,
  getImageData,
  renderCanvas,
  renderImageController,
  renderImageInfo,
  resolveDialogImage,
  applyZoomAndScroll,
} = vi.hoisted(() => ({
  applyImageList: vi.fn(),
  getImageData: vi.fn(),
  renderCanvas: vi.fn(),
  renderImageController: vi.fn(),
  renderImageInfo: vi.fn(),
  resolveDialogImage: vi.fn(),
  applyZoomAndScroll: vi.fn(),
}));

vi.mock('@/contexts/content-scripts/components/canvas', () => ({ renderCanvas }));
vi.mock('@/contexts/content-scripts/components/image-controller', () => ({
  renderImageController,
}));
vi.mock('@/contexts/content-scripts/components/image-info', () => ({ renderImageInfo }));
vi.mock('@/contexts/content-scripts/components/image-list', () => ({ applyImageList }));
vi.mock('@/contexts/content-scripts/utils', () => ({
  getImageData,
  resolveDialogImage,
  applyZoomAndScroll,
}));

const patchPrototypeMethod = <T extends object, K extends keyof T>(
  target: T,
  key: K,
  implementation: T[K],
) => {
  const original = Object.getOwnPropertyDescriptor(target, key);

  target[key] = implementation;

  return () => {
    if (original) {
      Object.defineProperty(target, key, original);
    } else {
      Reflect.deleteProperty(target, key);
    }
  };
};

const restoreFns: Array<() => void> = [];

/**
 * jsdom は showModal 未実装のため、open フラグの更新のみを模した最小限のパッチを当てる。
 * 呼び出し回数を数えられるよう vi.fn でラップする。
 */
const patchShowModal = () => {
  const showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });

  restoreFns.push(patchPrototypeMethod(HTMLDialogElement.prototype, 'showModal', showModal));

  return showModal;
};

const importShowDialog = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { showDialog } = await import('@/contexts/content-scripts/show-dialog');
  const { STATE } = await import('@/contexts/content-scripts/state');
  const { CONTENT_UI } = await import('@/contexts/content-scripts/ui');

  return { showDialog, STATE, CONTENT_UI };
};

afterEach(() => {
  restoreFns.splice(0).forEach((restore) => {
    restore();
  });
  vi.unstubAllGlobals();
  vi.resetModules();
  applyImageList.mockReset();
  getImageData.mockReset();
  renderCanvas.mockReset();
  renderImageController.mockReset();
  renderImageInfo.mockReset();
  resolveDialogImage.mockReset();
  applyZoomAndScroll.mockReset();
});

describe('showDialog', () => {
  it('opens the dialog and returns early when there is no current image', async () => {
    const showModal = patchShowModal();
    const { showDialog, STATE, CONTENT_UI } = await importShowDialog();

    STATE.currentImageElement = null;

    await showDialog();

    expect(CONTENT_UI.dialog.open).toBe(true);
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(resolveDialogImage).not.toHaveBeenCalled();
    expect(renderCanvas).not.toHaveBeenCalled();
  });

  it('renders nothing further when resolveDialogImage fails to resolve (404)', async () => {
    patchShowModal();
    const { showDialog, STATE } = await importShowDialog();
    const image = document.createElement('img');

    STATE.currentImageElement = image;
    getImageData.mockReturnValue({});
    resolveDialogImage.mockResolvedValue(null);

    await showDialog();

    expect(renderCanvas).not.toHaveBeenCalled();
    expect(applyImageList).not.toHaveBeenCalled();
    expect(applyZoomAndScroll).not.toHaveBeenCalled();
  });

  it('focuses the current image-list item without re-opening when the dialog stays open', async () => {
    const showModal = patchShowModal();
    const { showDialog, STATE, CONTENT_UI } = await importShowDialog();
    const image = document.createElement('img');
    const clonedImage = document.createElement('img');

    STATE.currentImageElement = image;
    getImageData.mockReturnValue({});
    resolveDialogImage.mockImplementation(() => {
      // 実装同様、解決後は STATE.currentImageElement がクローンへ切り替わっている想定
      STATE.currentImageElement = clonedImage;
      return Promise.resolve({ initialScale: null });
    });

    const currentButton = document.createElement('button');
    currentButton.setAttribute('aria-current', 'true');
    const focus = vi.fn();
    currentButton.focus = focus;
    CONTENT_UI.imageList.appendChild(currentButton);

    await showDialog();

    expect(showModal).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(applyZoomAndScroll).toHaveBeenCalledWith({
      targetImage: clonedImage,
      scaleValue: 'init',
    });
    expect(renderCanvas).toHaveBeenCalledTimes(1);
    expect(applyImageList).toHaveBeenCalledWith(false);
  });

  it('re-opens the dialog when it was closed while resolveDialogImage was pending', async () => {
    const showModal = patchShowModal();
    const { showDialog, STATE, CONTENT_UI } = await importShowDialog();
    const image = document.createElement('img');

    STATE.currentImageElement = image;
    getImageData.mockReturnValue({});
    resolveDialogImage.mockImplementation(() => {
      // 待機中に何らかの理由でダイアログが閉じたケースを模す
      CONTENT_UI.dialog.open = false;
      return Promise.resolve({ initialScale: null });
    });

    await showDialog();

    expect(showModal).toHaveBeenCalledTimes(2);
    expect(CONTENT_UI.dialog.open).toBe(true);
  });

  it('falls back to init scale when initialScale resolves to 0', async () => {
    patchShowModal();
    const { showDialog, STATE } = await importShowDialog();
    const image = document.createElement('img');

    STATE.currentImageElement = image;
    getImageData.mockReturnValue({});
    resolveDialogImage.mockResolvedValue({ initialScale: 0 });

    await showDialog();

    expect(applyZoomAndScroll).toHaveBeenCalledWith({
      targetImage: image,
      scaleValue: 'init',
    });
  });

  it('passes useCache through to applyImageList', async () => {
    patchShowModal();
    const { showDialog, STATE } = await importShowDialog();
    const image = document.createElement('img');

    STATE.currentImageElement = image;
    getImageData.mockReturnValue({});
    resolveDialogImage.mockResolvedValue({ initialScale: null });

    await showDialog({ useCache: true });

    expect(applyImageList).toHaveBeenCalledWith(true);
  });
});
