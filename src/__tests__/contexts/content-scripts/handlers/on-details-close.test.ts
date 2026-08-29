import { afterEach, describe, expect, it, vi } from 'vitest';

const importOnDetailsClose = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { onDetailsClose } = await import('@/contexts/content-scripts/handlers/on-details-close');
  const { CONTENT_UI } = await import('@/contexts/content-scripts/ui');

  return { onDetailsClose, CONTENT_UI };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('onDetailsClose', () => {
  it('closes the shared dialog', async () => {
    const { onDetailsClose, CONTENT_UI } = await importOnDetailsClose();
    const close = vi.fn();

    CONTENT_UI.dialog.close = close;

    onDetailsClose();

    expect(close).toHaveBeenCalledOnce();
  });
});
