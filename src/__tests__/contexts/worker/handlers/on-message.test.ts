import { afterEach, describe, expect, it, vi } from 'vitest';

const { getLocalFileSize } = vi.hoisted(() => ({
  getLocalFileSize: vi.fn(),
}));

vi.mock('@/contexts/worker/features', () => ({ getLocalFileSize }));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('onMessage', () => {
  it('ignores messages of an unknown type', async () => {
    const { onMessage } = await import('@/contexts/worker/handlers/on-message');
    const sendResponse = vi.fn();

    const kept = onMessage({ type: 'other' }, {}, sendResponse);

    expect(kept).toBe(false);
    expect(getLocalFileSize).not.toHaveBeenCalled();
    expect(sendResponse).not.toHaveBeenCalled();
  });

  it('resolves get-local-file-size requests and keeps the channel open', async () => {
    getLocalFileSize.mockResolvedValue({ ok: true, fileSize: 1234, fileType: 'image/png' });
    const { onMessage } = await import('@/contexts/worker/handlers/on-message');
    const sendResponse = vi.fn();

    const kept = onMessage({ type: 'get-local-file-size', url: 'file:///a.png' }, {}, sendResponse);

    expect(kept).toBe(true);
    expect(getLocalFileSize).toHaveBeenCalledWith('file:///a.png');
    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        fileSize: 1234,
        fileType: 'image/png',
      });
    });
  });
});
