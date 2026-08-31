import { afterEach, describe, expect, it, vi } from 'vitest';

const { updateState } = vi.hoisted(() => ({
  updateState: vi.fn(),
}));

vi.mock('@/contexts/content-scripts/components/image-controller/utils', () => ({ updateState }));

const importRotate = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { addEventRotateControllers } =
    await import('@/contexts/content-scripts/components/image-controller/effects/rotate');
  const { buildImageController } =
    await import('@/contexts/content-scripts/components/image-controller/renderers/build-image-controller');

  return { addEventRotateControllers, fields: buildImageController() };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  updateState.mockReset();
});

describe('addEventRotateControllers', () => {
  it('stops the wheel event from propagating to the page', async () => {
    const { addEventRotateControllers, fields } = await importRotate();
    addEventRotateControllers(fields);

    const wheelEvent = new Event('wheel', { bubbles: true, cancelable: true });
    const stopPropagation = vi.spyOn(wheelEvent, 'stopPropagation');

    fields.rotate.dispatchEvent(wheelEvent);

    expect(stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('falls back to the default rotate value when the input is not a number', async () => {
    const { addEventRotateControllers, fields } = await importRotate();
    addEventRotateControllers(fields);

    const { defaultState } = await import('@/contexts/content-scripts/utils');
    // type="number" は不正な文字列を空文字へ正規化してしまうため、
    // Number.isNaN 分岐そのものを検証するには value setter を迂回する必要がある
    Object.defineProperty(fields.rotate, 'value', { value: 'not-a-number', configurable: true });
    fields.rotate.dispatchEvent(new Event('input'));

    expect(updateState).toHaveBeenCalledWith({ rotate: defaultState.rotate });
  });

  it('rotates left and right by 90deg increments relative to the current value', async () => {
    const { addEventRotateControllers, fields } = await importRotate();
    addEventRotateControllers(fields);

    fields.rotate.value = '30';
    fields.rotateLeft.dispatchEvent(new Event('click'));
    expect(updateState).toHaveBeenCalledWith({ rotate: -60 });

    fields.rotate.value = '30';
    fields.rotateRight.dispatchEvent(new Event('click'));
    expect(updateState).toHaveBeenCalledWith({ rotate: 120 });
  });

  it('treats an empty rotate value as 0 when rotating left/right', async () => {
    const { addEventRotateControllers, fields } = await importRotate();
    addEventRotateControllers(fields);

    fields.rotate.value = '';
    fields.rotateLeft.dispatchEvent(new Event('click'));
    expect(updateState).toHaveBeenCalledWith({ rotate: -90 });

    fields.rotate.value = '';
    fields.rotateRight.dispatchEvent(new Event('click'));
    expect(updateState).toHaveBeenCalledWith({ rotate: 90 });
  });

  it('resets rotate to 0', async () => {
    const { addEventRotateControllers, fields } = await importRotate();
    addEventRotateControllers(fields);

    fields.rotateReset.dispatchEvent(new Event('click'));

    expect(updateState).toHaveBeenCalledWith({ rotate: 0 });
  });
});
