import { afterEach, describe, expect, it, vi } from 'vitest';

const { setImageData } = vi.hoisted(() => ({
  setImageData: vi.fn(),
}));

vi.mock('@/contexts/content-scripts/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/contexts/content-scripts/utils')>()),
  setImageData,
}));

const importUpdateState = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { updateState } =
    await import('@/contexts/content-scripts/components/image-controller/utils/update-state');
  const { STATE } = await import('@/contexts/content-scripts/state');

  return { updateState, STATE };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  setImageData.mockClear();
});

describe('updateState', () => {
  it('writes the given options onto the currently tracked image', async () => {
    const { updateState, STATE } = await importUpdateState();
    const img = document.createElement('img');
    STATE.currentImageElement = img;

    updateState({ scale: 50 });

    expect(setImageData).toHaveBeenCalledWith(img, { scale: 50 });
  });

  it('does nothing when there is no currently tracked image', async () => {
    const { updateState, STATE } = await importUpdateState();
    STATE.currentImageElement = null;

    expect(() => {
      updateState({ scale: 50 });
    }).not.toThrow();
    expect(setImageData).not.toHaveBeenCalled();
  });
});
