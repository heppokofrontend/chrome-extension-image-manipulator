import { afterEach, describe, expect, it, vi } from 'vitest';

const importRenderImageController = async () => {
  vi.stubGlobal('chrome', {
    i18n: { getMessage: (key: string) => key },
    storage: {
      local: {
        get: (_key: string, callback: (items: { background?: string }) => void) => {
          callback({});
        },
      },
    },
  });

  const { initImageController, renderImageController } =
    await import('@/contexts/content-scripts/components/image-controller/renderers');
  const { STATE } = await import('@/contexts/content-scripts/state');
  const { CONTENT_UI } = await import('@/contexts/content-scripts/ui');

  return { initImageController, renderImageController, STATE, CONTENT_UI };
};

const baseImageData = () => ({
  scale: 50,
  rotate: 90,
  reverse: true,
  render: 'pixelated' as RenderingMode,
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  document.body.innerHTML = '';
});

describe('renderImageController', () => {
  it('does nothing when called before initImageController has ever run', async () => {
    const { renderImageController } = await importRenderImageController();

    expect(() => {
      renderImageController(baseImageData());
    }).not.toThrow();
  });

  it('does nothing when there is no currently tracked image', async () => {
    const { initImageController, renderImageController, STATE, CONTENT_UI } =
      await importRenderImageController();
    initImageController();
    STATE.currentImageElement = null;

    const scaleField = CONTENT_UI.imageController.querySelector<HTMLInputElement>('#scale');

    renderImageController(baseImageData());

    expect(scaleField?.value).toBe('');
  });

  it('writes the image data onto the controller fields once initialized', async () => {
    const { initImageController, renderImageController, STATE, CONTENT_UI } =
      await importRenderImageController();
    initImageController();
    STATE.currentImageElement = document.createElement('img');

    renderImageController(baseImageData());

    const scaleField = CONTENT_UI.imageController.querySelector<HTMLInputElement>('#scale');
    const rotateField = CONTENT_UI.imageController.querySelector<HTMLInputElement>('#rotate');
    const reverseField = CONTENT_UI.imageController.querySelector<HTMLInputElement>('#reverse');
    const renderField = CONTENT_UI.imageController.querySelector<HTMLSelectElement>('#render');

    expect(scaleField?.value).toBe('50');
    expect(rotateField?.value).toBe('90');
    expect(reverseField?.checked).toBe(true);
    expect(renderField?.value).toBe('pixelated');
  });
});
