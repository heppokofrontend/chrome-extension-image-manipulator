import { afterEach, describe, expect, it, vi } from 'vitest';

const { registerContextMenuClickListener, registerContextMenusListener } = vi.hoisted(() => ({
  registerContextMenuClickListener: vi.fn(),
  registerContextMenusListener: vi.fn(),
}));

vi.mock('@/contexts/worker/features', () => ({
  registerContextMenuClickListener,
  registerContextMenusListener,
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('worker entry point', () => {
  it('registers the context menu listeners at startup', async () => {
    await import('@/contexts/worker/index');

    expect(registerContextMenusListener).toHaveBeenCalledTimes(1);
    expect(registerContextMenuClickListener).toHaveBeenCalledTimes(1);
  });
});
