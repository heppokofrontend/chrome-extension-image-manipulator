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
    expect(setImageData).toHaveBeenCalledWith(img, {
      ...defaultState,
      isInDialog: true,
      oldScale: 40,
      fileSize: '5 byte',
    });
  });

  it('restores the default inline style outside a dialog without calling setImageData', async () => {
    const { resetCurrent, STATE } = await importResetCurrent();
    const img = document.createElement('img');
    img.dataset['imageManipulatorDefaultStyle'] = 'width: 10px;';
    img.setAttribute('style', 'width: 999px;');
    STATE.currentImageElement = img;

    resetCurrent(false);

    expect(img.getAttribute('style')).toBe('width: 10px;');
    expect(getImageData).not.toHaveBeenCalled();
    expect(setImageData).not.toHaveBeenCalled();
  });

  it('does nothing outside a dialog when the image has no recorded default style', async () => {
    const { resetCurrent, STATE } = await importResetCurrent();
    const img = document.createElement('img');
    img.setAttribute('style', 'width: 999px;');
    STATE.currentImageElement = img;

    resetCurrent(false);

    expect(img.getAttribute('style')).toBe('width: 999px;');
  });
});
