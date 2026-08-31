import { afterEach, describe, expect, it, vi } from 'vitest';

const { getFileSize, getImageData, setImageData, zoomAndScrollInit } = vi.hoisted(() => ({
  getFileSize: vi.fn(),
  getImageData: vi.fn(),
  setImageData: vi.fn(),
  zoomAndScrollInit: vi.fn(),
}));

vi.mock('@/contexts/content-scripts/utils/get-file-size', () => ({ getFileSize }));
vi.mock('@/contexts/content-scripts/utils/image-data', () => ({ getImageData, setImageData }));
vi.mock('@/contexts/content-scripts/utils/zoom-and-scroll', () => ({ zoomAndScrollInit }));

const importResolveDialogImage = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { resolveDialogImage } =
    await import('@/contexts/content-scripts/utils/resolve-dialog-image');
  const { STATE } = await import('@/contexts/content-scripts/state');

  return { resolveDialogImage, STATE };
};

const createOriginalImage = () => {
  const image = document.createElement('img');
  image.alt = 'alt-text';
  image.src = 'https://example.com/original.png';
  image.width = 100;
  image.height = 200;
  return image;
};

const stubCapturingImage = () => {
  const captured: { current?: HTMLImageElement } = {};

  vi.stubGlobal(
    'Image',
    new Proxy(Image, {
      construct(target, args) {
        const instance = Reflect.construct(target, args) as HTMLImageElement;
        captured.current = instance;
        return instance;
      },
    }),
  );

  return captured;
};

const baseImageData = (): Extract<StyleData, { isInDialog: false }> => ({
  isInDialog: false,
  clonedImage: null,
  scale: 100,
  oldScale: 100,
  rotate: 0,
  reverse: false,
  render: 'crisp-edges',
  fileSize: 'loading...',
  fileType: 'loading...',
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  getFileSize.mockReset();
  getImageData.mockReset();
  setImageData.mockReset();
  zoomAndScrollInit.mockReset();
});

describe('resolveDialogImage', () => {
  it('reassigns STATE.currentImageElement to the clone before getFileSize resolves', async () => {
    const { resolveDialogImage, STATE } = await importResolveDialogImage();
    const originalImage = createOriginalImage();

    STATE.currentImageElement = originalImage;

    const capturedClone = stubCapturingImage();

    let stateWhenGetFileSizeCalled: HTMLImageElement | null = null;
    getFileSize.mockImplementation(() => {
      // getFileSize が呼ばれた時点で STATE.currentImageElement が
      // 既にクローンへ切り替わっていること(=待機前の代入)を検証する
      stateWhenGetFileSizeCalled = STATE.currentImageElement;
      return Promise.resolve();
    });

    const resolvedPromise = resolveDialogImage(originalImage, baseImageData());

    expect(capturedClone.current).toBeDefined();
    capturedClone.current?.onload?.(new Event('load'));

    const resolved = await resolvedPromise;

    expect(stateWhenGetFileSizeCalled).toBe(capturedClone.current);
    expect(getFileSize).toHaveBeenCalledWith(capturedClone.current);
    expect(resolved).toEqual({ initialScale: null });
  });

  it('leaves STATE.currentImageElement untouched and returns null on load failure', async () => {
    const { resolveDialogImage, STATE } = await importResolveDialogImage();
    const originalImage = createOriginalImage();

    STATE.currentImageElement = originalImage;

    const capturedClone = stubCapturingImage();

    const resolvedPromise = resolveDialogImage(originalImage, baseImageData());

    expect(capturedClone.current).toBeDefined();
    capturedClone.current?.onerror?.(new Event('error'));

    const resolved = await resolvedPromise;

    expect(resolved).toBeNull();
    expect(STATE.currentImageElement).toBe(originalImage);
    expect(getFileSize).not.toHaveBeenCalled();
  });

  it('reuses an existing clone without creating a new image or calling getFileSize', async () => {
    const { resolveDialogImage, STATE } = await importResolveDialogImage();
    const originalImage = createOriginalImage();
    const existingClone = document.createElement('img');

    STATE.currentImageElement = originalImage;
    getImageData.mockReturnValue({ scale: 42 });

    const resolved = await resolveDialogImage(originalImage, {
      ...baseImageData(),
      clonedImage: existingClone,
    });

    expect(STATE.currentImageElement).toBe(existingClone);
    expect(resolved).toEqual({ initialScale: 42 });
    expect(getFileSize).not.toHaveBeenCalled();
  });

  it('returns initialScale without touching STATE when the image is already in the dialog', async () => {
    const { resolveDialogImage, STATE } = await importResolveDialogImage();
    const clonedImage = document.createElement('img');

    STATE.currentImageElement = clonedImage;

    const resolved = await resolveDialogImage(clonedImage, {
      isInDialog: true,
      scale: 100,
      oldScale: 100,
      rotate: 0,
      reverse: false,
      render: 'crisp-edges',
      fileSize: 'loading...',
      fileType: 'loading...',
    });

    expect(resolved).toEqual({ initialScale: null });
    expect(STATE.currentImageElement).toBe(clonedImage);
    expect(getFileSize).not.toHaveBeenCalled();
  });
});
