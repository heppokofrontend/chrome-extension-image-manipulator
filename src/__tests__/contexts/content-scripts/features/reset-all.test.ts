import { afterEach, describe, expect, it, vi } from 'vitest';

const { getImageData, setImageData } = vi.hoisted(() => ({
  getImageData: vi.fn(),
  setImageData: vi.fn(),
}));

vi.mock('@/contexts/content-scripts/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/contexts/content-scripts/utils')>()),
  getImageData,
  setImageData,
}));

const importResetAll = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { defaultState } = await import('@/contexts/content-scripts/utils');
  const { resetAll } = await import('@/contexts/content-scripts/features/reset-all');
  const { STATE } = await import('@/contexts/content-scripts/state');

  return { resetAll, defaultState, STATE };
};

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.resetModules();
  getImageData.mockClear();
  setImageData.mockClear();
});

describe('resetAll', () => {
  it('resets the currently tracked image and restores its default inline style', async () => {
    const { resetAll, defaultState, STATE } = await importResetAll();
    const img = document.createElement('img');
    img.dataset['imageManipulatorDefaultStyle'] = 'width: 10px;';
    img.setAttribute('style', 'width: 999px;');
    STATE.currentImageElement = img;
    getImageData.mockReturnValue({ ...defaultState, oldScale: 50, fileSize: '1 byte' });

    resetAll();

    expect(setImageData).toHaveBeenCalledWith(img, {
      ...defaultState,
      oldScale: 50,
      fileSize: '1 byte',
    });
    expect(img.getAttribute('style')).toBe('width: 10px;');
  });

  it('also resets every other tracked image found in the document', async () => {
    const { resetAll, defaultState, STATE } = await importResetAll();
    STATE.currentImageElement = null;
    const other = document.createElement('img');
    other.dataset['imageManipulatorDefaultStyle'] = 'width: 20px;';
    document.body.appendChild(other);
    getImageData.mockReturnValue({ ...defaultState });

    resetAll();

    expect(setImageData).toHaveBeenCalledWith(other, { ...defaultState });
    expect(other.getAttribute('style')).toBe('width: 20px;');
  });

  it('does not reset a cloned image when the source image is itself in a dialog', async () => {
    const { resetAll, defaultState, STATE } = await importResetAll();
    const img = document.createElement('img');
    STATE.currentImageElement = img;
    const clonedImage = document.createElement('img');
    clonedImage.src = 'cloned.png';
    getImageData.mockReturnValue({ ...defaultState, isInDialog: true, clonedImage });

    resetAll();

    expect(setImageData).toHaveBeenCalledTimes(1);
    expect(setImageData).not.toHaveBeenCalledWith(clonedImage, expect.anything());
  });

  it('resets the cloned image with isInDialog true when the source image is not in a dialog', async () => {
    const { resetAll, defaultState, STATE } = await importResetAll();
    const img = document.createElement('img');
    STATE.currentImageElement = img;
    const clonedImage = document.createElement('img');
    getImageData.mockImplementation((key: HTMLImageElement) =>
      key === img
        ? { ...defaultState, isInDialog: false, clonedImage, oldScale: 75, fileSize: '2 byte' }
        : { ...defaultState, oldScale: 25, fileSize: '3 byte' },
    );

    resetAll();

    expect(setImageData).toHaveBeenCalledWith(img, {
      ...defaultState,
      oldScale: 75,
      fileSize: '2 byte',
    });
    expect(setImageData).toHaveBeenCalledWith(clonedImage, {
      ...defaultState,
      isInDialog: true,
      oldScale: 25,
      fileSize: '3 byte',
    });
  });
});
