import { afterEach, describe, expect, it, vi } from 'vitest';

const { updateState, applyZoomAndScroll } = vi.hoisted(() => ({
  updateState: vi.fn(),
  applyZoomAndScroll: vi.fn(),
}));

vi.mock('@/contexts/content-scripts/components/image-controller/utils', () => ({ updateState }));
vi.mock('@/contexts/content-scripts/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/contexts/content-scripts/utils')>()),
  applyZoomAndScroll,
}));

const importScale = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { addEventScaleControllers } =
    await import('@/contexts/content-scripts/components/image-controller/effects/scale');
  const { buildImageController } =
    await import('@/contexts/content-scripts/components/image-controller/renderers/build-image-controller');
  const { STATE } = await import('@/contexts/content-scripts/state');

  return { addEventScaleControllers, fields: buildImageController(), STATE };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  updateState.mockReset();
  applyZoomAndScroll.mockReset();
});

describe('addEventScaleControllers', () => {
  it('stops the wheel event from propagating to the page', async () => {
    const { addEventScaleControllers, fields } = await importScale();
    addEventScaleControllers(fields);

    const wheelEvent = new Event('wheel', { bubbles: true, cancelable: true });
    const stopPropagation = vi.spyOn(wheelEvent, 'stopPropagation');

    fields.scale.dispatchEvent(wheelEvent);

    expect(stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('falls back to the default scale value when the input is not a number', async () => {
    const { addEventScaleControllers, fields } = await importScale();
    addEventScaleControllers(fields);

    const { defaultState } = await import('@/contexts/content-scripts/utils');
    // type="number" は不正な文字列を空文字へ正規化してしまうため、
    // Number.isNaN 分岐そのものを検証するには value setter を迂回する必要がある
    Object.defineProperty(fields.scale, 'value', { value: 'not-a-number', configurable: true });
    fields.scale.dispatchEvent(new Event('input'));

    expect(updateState).toHaveBeenCalledWith({ scale: defaultState.scale });
  });

  it('resets to 100% without touching the zoom/scroll origin', async () => {
    const { addEventScaleControllers, fields } = await importScale();
    addEventScaleControllers(fields);

    fields.scale100.dispatchEvent(new Event('click'));

    expect(updateState).toHaveBeenCalledWith({ scale: 100 });
    expect(applyZoomAndScroll).not.toHaveBeenCalled();
  });

  it('fits the currently tracked image to the viewer', async () => {
    const { addEventScaleControllers, fields, STATE } = await importScale();
    const image = document.createElement('img');
    STATE.currentImageElement = image;
    addEventScaleControllers(fields);

    fields.scaleFit.dispatchEvent(new Event('click'));

    expect(updateState).toHaveBeenCalledWith({ scale: 100 });
    expect(applyZoomAndScroll).toHaveBeenCalledWith({
      targetImage: image,
      scaleValue: 'fit',
    });
  });

  it('does nothing on fit-click when there is no currently tracked image', async () => {
    const { addEventScaleControllers, fields, STATE } = await importScale();
    STATE.currentImageElement = null;
    addEventScaleControllers(fields);

    fields.scaleFit.dispatchEvent(new Event('click'));

    expect(updateState).not.toHaveBeenCalled();
    expect(applyZoomAndScroll).not.toHaveBeenCalled();
  });
});
