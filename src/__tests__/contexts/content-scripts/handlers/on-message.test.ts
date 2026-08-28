import { afterEach, describe, expect, it, vi } from 'vitest';

const { resetAll, resetCurrent, getImageData, setImageData, showDialog } = vi.hoisted(() => ({
  resetAll: vi.fn(),
  resetCurrent: vi.fn(),
  getImageData: vi.fn(),
  setImageData: vi.fn(),
  showDialog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/contexts/content-scripts/features', () => ({
  resetAll,
  resetCurrent,
}));

vi.mock('@/contexts/content-scripts/show-dialog', () => ({
  showDialog,
}));

vi.mock('@/contexts/content-scripts/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/contexts/content-scripts/utils')>()),
  getImageData,
  setImageData,
}));

const importOnMessage = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { onMessage } = await import('@/contexts/content-scripts/handlers/on-message');
  const { STATE } = await import('@/contexts/content-scripts/state');

  return { onMessage, STATE };
};

const sender = {} as chrome.runtime.MessageSender;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  resetAll.mockClear();
  resetCurrent.mockClear();
  getImageData.mockClear();
  setImageData.mockClear();
  showDialog.mockClear();
});

describe('onMessage', () => {
  it('delegates reset-all to resetAll without reading any image data', async () => {
    const { onMessage, STATE } = await importOnMessage();
    const img = document.createElement('img');
    STATE.currentImageElement = img;

    onMessage({ menuItemId: 'reset-all' }, sender, vi.fn());

    expect(resetAll).toHaveBeenCalledWith();
    expect(getImageData).not.toHaveBeenCalled();
  });

  it('does nothing when there is no tracked image and the action is not reset-all', async () => {
    const { onMessage, STATE } = await importOnMessage();
    STATE.currentImageElement = null;

    onMessage({ menuItemId: 'reverse' }, sender, vi.fn());

    expect(getImageData).not.toHaveBeenCalled();
    expect(setImageData).not.toHaveBeenCalled();
  });

  it('sets scale from a percentage menu item', async () => {
    const { onMessage, STATE } = await importOnMessage();
    const img = document.createElement('img');
    STATE.currentImageElement = img;
    getImageData.mockReturnValue({ isInDialog: false });

    onMessage({ menuItemId: '150%' }, sender, vi.fn());

    expect(setImageData).toHaveBeenCalledWith(img, { scale: 150 });
  });

  it('sets rotate from a degree menu item', async () => {
    const { onMessage, STATE } = await importOnMessage();
    const img = document.createElement('img');
    STATE.currentImageElement = img;
    getImageData.mockReturnValue({ isInDialog: false });

    onMessage({ menuItemId: '90deg' }, sender, vi.fn());

    expect(setImageData).toHaveBeenCalledWith(img, { rotate: 90 });
  });

  it('delegates reset to resetCurrent with the current isInDialog flag', async () => {
    const { onMessage, STATE } = await importOnMessage();
    const img = document.createElement('img');
    STATE.currentImageElement = img;
    getImageData.mockReturnValue({ isInDialog: true });

    onMessage({ menuItemId: 'reset' }, sender, vi.fn());

    expect(resetCurrent).toHaveBeenCalledWith(true);
  });

  it('toggles reverse based on the current image data', async () => {
    const { onMessage, STATE } = await importOnMessage();
    const img = document.createElement('img');
    STATE.currentImageElement = img;
    getImageData.mockReturnValue({ isInDialog: false, reverse: false });

    onMessage({ menuItemId: 'reverse' }, sender, vi.fn());

    expect(setImageData).toHaveBeenCalledWith(img, { reverse: true });
  });

  it('invokes showDialog for the dialog menu item', async () => {
    const { onMessage, STATE } = await importOnMessage();
    const img = document.createElement('img');
    STATE.currentImageElement = img;
    getImageData.mockReturnValue({ isInDialog: false });

    onMessage({ menuItemId: 'dialog' }, sender, vi.fn());

    expect(showDialog).toHaveBeenCalled();
  });

  it('responds with true synchronously and does not keep the message channel open', async () => {
    const { onMessage, STATE } = await importOnMessage();
    STATE.currentImageElement = null;
    const sendResponse = vi.fn();

    const result = onMessage({ menuItemId: 'reverse' }, sender, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith(true);
    expect(result).toBe(true);
  });
});
