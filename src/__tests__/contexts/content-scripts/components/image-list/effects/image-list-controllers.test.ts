import { afterEach, describe, expect, it, vi } from 'vitest';

const { applyImageList } = vi.hoisted(() => ({
  applyImageList: vi.fn(),
}));

vi.mock('@/contexts/content-scripts/components/image-list/effects/apply-image-list', () => ({
  applyImageList,
}));

const importImageListControllers = async () => {
  const { addEventImageListControllers } =
    await import('@/contexts/content-scripts/components/image-list/effects/image-list-controllers');

  return { addEventImageListControllers };
};

const buildFields = () => {
  const imageList = document.createElement('ul');
  const imageListReload = document.createElement('button');
  const imageListPrev = document.createElement('button');
  const imageListNext = document.createElement('button');

  return { imageList, imageListReload, imageListPrev, imageListNext };
};

const appendItem = (imageList: HTMLElement, current: boolean) => {
  const li = document.createElement('li');
  const button = document.createElement('button');
  if (current) {
    button.setAttribute('aria-current', 'true');
  }
  li.appendChild(button);
  imageList.appendChild(li);
  return button;
};

afterEach(() => {
  vi.resetModules();
  applyImageList.mockReset();
});

describe('addEventImageListControllers', () => {
  it('stops the wheel event from propagating to the page', async () => {
    const { addEventImageListControllers } = await importImageListControllers();
    const fields = buildFields();
    addEventImageListControllers(fields);

    const wheelEvent = new Event('wheel', { bubbles: true, cancelable: true });
    const stopPropagation = vi.spyOn(wheelEvent, 'stopPropagation');

    fields.imageList.dispatchEvent(wheelEvent);

    expect(stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('stops propagation and prevents default only for arrow keys', async () => {
    const { addEventImageListControllers } = await importImageListControllers();
    const fields = buildFields();
    addEventImageListControllers(fields);

    const arrowEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    const arrowStopPropagation = vi.spyOn(arrowEvent, 'stopPropagation');
    const arrowPreventDefault = vi.spyOn(arrowEvent, 'preventDefault');
    fields.imageList.dispatchEvent(arrowEvent);
    expect(arrowStopPropagation).toHaveBeenCalledTimes(1);
    expect(arrowPreventDefault).toHaveBeenCalledTimes(1);

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    const enterStopPropagation = vi.spyOn(enterEvent, 'stopPropagation');
    const enterPreventDefault = vi.spyOn(enterEvent, 'preventDefault');
    fields.imageList.dispatchEvent(enterEvent);
    expect(enterStopPropagation).toHaveBeenCalledTimes(1);
    expect(enterPreventDefault).not.toHaveBeenCalled();
  });

  it('reloads the image list on reload click', async () => {
    const { addEventImageListControllers } = await importImageListControllers();
    const fields = buildFields();
    addEventImageListControllers(fields);

    fields.imageListReload.dispatchEvent(new Event('click'));

    expect(applyImageList).toHaveBeenCalledTimes(1);
  });

  it('focuses the next sibling item on next click', async () => {
    const { addEventImageListControllers } = await importImageListControllers();
    const fields = buildFields();
    appendItem(fields.imageList, true);
    const next = appendItem(fields.imageList, false);
    const click = vi.fn();
    next.click = click;
    addEventImageListControllers(fields);

    fields.imageListNext.dispatchEvent(new Event('click'));

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('loops to the first item on next click when the current item is last', async () => {
    const { addEventImageListControllers } = await importImageListControllers();
    const fields = buildFields();
    const first = appendItem(fields.imageList, false);
    appendItem(fields.imageList, true);
    const click = vi.fn();
    first.click = click;
    addEventImageListControllers(fields);

    fields.imageListNext.dispatchEvent(new Event('click'));

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('focuses the previous sibling item on prev click', async () => {
    const { addEventImageListControllers } = await importImageListControllers();
    const fields = buildFields();
    const prev = appendItem(fields.imageList, false);
    appendItem(fields.imageList, true);
    const click = vi.fn();
    prev.click = click;
    addEventImageListControllers(fields);

    fields.imageListPrev.dispatchEvent(new Event('click'));

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('loops to the last item on prev click when the current item is first', async () => {
    const { addEventImageListControllers } = await importImageListControllers();
    const fields = buildFields();
    appendItem(fields.imageList, true);
    const last = appendItem(fields.imageList, false);
    const click = vi.fn();
    last.click = click;
    addEventImageListControllers(fields);

    fields.imageListPrev.dispatchEvent(new Event('click'));

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('does nothing on next/prev click when the list has no items at all', async () => {
    const { addEventImageListControllers } = await importImageListControllers();
    const fields = buildFields();
    addEventImageListControllers(fields);

    expect(() => {
      fields.imageListNext.dispatchEvent(new Event('click'));
      fields.imageListPrev.dispatchEvent(new Event('click'));
    }).not.toThrow();
  });
});
