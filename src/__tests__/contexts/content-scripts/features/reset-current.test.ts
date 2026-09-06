import { afterEach, describe, expect, it, vi } from 'vitest';

const { applyImageStyle, getImageData, setImageData } = vi.hoisted(() => ({
  applyImageStyle: vi.fn(),
  getImageData: vi.fn(),
  setImageData: vi.fn(),
}));

vi.mock('@/contexts/content-scripts/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/contexts/content-scripts/utils')>()),
  getImageData,
  setImageData,
}));

vi.mock('@/contexts/content-scripts/effects', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/contexts/content-scripts/effects/apply-image-style')
  >()),
  applyImageStyle,
}));

const importResetCurrent = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { defaultState } = await import('@/contexts/content-scripts/utils');
  const { resetCurrent } = await import('@/contexts/content-scripts/features/reset-current');
  const { STATE } = await import('@/contexts/content-scripts/state');

  return { resetCurrent, defaultState, STATE };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  applyImageStyle.mockClear();
  getImageData.mockClear();
  setImageData.mockClear();
});

describe('resetCurrent', () => {
  it('does nothing when there is no currently tracked image', async () => {
    const { resetCurrent, STATE } = await importResetCurrent();
    STATE.currentImageElement = null;

    expect(() => {
      resetCurrent(true);
    }).not.toThrow();

    expect(getImageData).not.toHaveBeenCalled();
    expect(setImageData).not.toHaveBeenCalled();
  });

  it('clears the inline style and resets the tracked image while keeping isInDialog true', async () => {
    const { resetCurrent, defaultState, STATE } = await importResetCurrent();
    const img = document.createElement('img');
    img.setAttribute('style', 'width: 999px;');
    STATE.currentImageElement = img;
    getImageData.mockReturnValue({ ...defaultState, oldScale: 40, fileSize: '5 byte' });

    resetCurrent(true);

    expect(img.getAttribute('style')).toBeNull();
    expect(setImageData).toHaveBeenCalledWith({
      image: img,
      options: {
        ...defaultState,
        isInDialog: true,
        oldScale: 40,
        fileSize: '5 byte',
      },
    });
    expect(applyImageStyle).toHaveBeenCalledWith(img);
  });

  it('resets the tracked image data and restores the default inline style outside a dialog', async () => {
    // 個別リセットが style 属性だけ戻して imageDataMap を放置すると、次の編集(reverse等)が
    // 古い scale/isReversed を読み直して復活させてしまう(過去のバグ)。map 側も必ず
    // defaultState に戻す。
    const { resetCurrent, defaultState, STATE } = await importResetCurrent();
    const img = document.createElement('img');
    img.dataset['imageManipulatorDefaultStyle'] = 'width: 10px;';
    img.setAttribute('style', 'width: 999px;');
    STATE.currentImageElement = img;
    getImageData.mockReturnValue({
      ...defaultState,
      scale: 150,
      isReversed: true,
      clonedImage: null,
      oldScale: 100,
      fileSize: '5 byte',
    });

    resetCurrent(false);

    expect(setImageData).toHaveBeenCalledWith({
      image: img,
      options: {
        ...defaultState,
        oldScale: 100,
        fileSize: '5 byte',
      },
    });
    expect(applyImageStyle).toHaveBeenCalledWith(img);
    expect(img.getAttribute('style')).toBe('width: 10px;');
  });

  it('also resets the associated clone when the tracked image has one', async () => {
    const { resetCurrent, defaultState, STATE } = await importResetCurrent();
    const img = document.createElement('img');
    const clone = document.createElement('img');
    STATE.currentImageElement = img;
    getImageData.mockImplementation((image: HTMLImageElement) =>
      image === img
        ? { ...defaultState, scale: 150, isReversed: true, clonedImage: clone, oldScale: 100 }
        : {
            ...defaultState,
            isInDialog: true,
            scale: 150,
            rotate: 45,
            oldScale: 100,
            fileSize: '2 byte',
          },
    );

    resetCurrent(false);

    expect(setImageData).toHaveBeenCalledWith({
      image: clone,
      options: {
        ...defaultState,
        isInDialog: true,
        oldScale: 100,
        fileSize: '2 byte',
      },
    });
    expect(applyImageStyle).toHaveBeenCalledWith(clone);
  });

  it('removes an inserted pseudo image and re-shows the original svg outside a dialog', async () => {
    const { resetCurrent, defaultState, STATE } = await importResetCurrent();
    const { convertSVGToImg } = await import('@/contexts/content-scripts/utils');
    const { ensurePseudoImageVisible } = await import('@/contexts/content-scripts/effects');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svg);
    const pseudoImage = convertSVGToImg(svg);

    ensurePseudoImageVisible(pseudoImage);
    expect(svg.style.display).toBe('none');
    expect(pseudoImage.isConnected).toBe(true);

    STATE.currentImageElement = pseudoImage;
    getImageData.mockReturnValue({ ...defaultState, clonedImage: null });

    resetCurrent(false);

    expect(svg.style.display).toBe('');
    expect(pseudoImage.isConnected).toBe(false);
  });

  it('does nothing to the inline style outside a dialog when the image has no recorded default style', async () => {
    const { resetCurrent, defaultState, STATE } = await importResetCurrent();
    const img = document.createElement('img');
    img.setAttribute('style', 'width: 999px;');
    STATE.currentImageElement = img;
    getImageData.mockReturnValue({ ...defaultState, clonedImage: null });

    resetCurrent(false);

    expect(img.getAttribute('style')).toBe('width: 999px;');
  });
});
