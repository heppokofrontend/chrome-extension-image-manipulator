import { afterEach, describe, expect, it, vi } from 'vitest';

const { showDialog } = vi.hoisted(() => ({
  showDialog: vi.fn(),
}));

vi.mock('@/contexts/content-scripts/show-dialog', () => ({ showDialog }));

const importOnImageListItemClick = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { imageListItemSourceMap, onImageListItemClick } =
    await import('@/contexts/content-scripts/components/image-list/handlers/on-image-list-item-click');
  const { STATE } = await import('@/contexts/content-scripts/state');

  return { imageListItemSourceMap, onImageListItemClick, STATE };
};

const makeClickEvent = (currentTarget: EventTarget) => ({ currentTarget }) as unknown as MouseEvent;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  showDialog.mockReset();
});

describe('onImageListItemClick', () => {
  it('does nothing when currentTarget is not a button', async () => {
    const { onImageListItemClick } = await importOnImageListItemClick();
    const div = document.createElement('div');

    expect(() => {
      onImageListItemClick(makeClickEvent(div));
    }).not.toThrow();
    expect(showDialog).not.toHaveBeenCalled();
  });

  it('does nothing when the button has no entry in imageListItemSourceMap', async () => {
    const { onImageListItemClick } = await importOnImageListItemClick();
    const button = document.createElement('button');

    expect(() => {
      onImageListItemClick(makeClickEvent(button));
    }).not.toThrow();
    expect(showDialog).not.toHaveBeenCalled();
  });

  it('does nothing when the mapped element cannot be resolved and there is no prior current image', async () => {
    const { imageListItemSourceMap, onImageListItemClick, STATE } =
      await importOnImageListItemClick();
    const button = document.createElement('button');
    // convertedSvgMap/convertedDummyMap のどちらにも登録されていない要素なので resolveImageElement は undefined を返す
    const unresolvableSource = document.createElement('div');

    imageListItemSourceMap.set(button, unresolvableSource);
    STATE.currentImageElement = null;

    onImageListItemClick(makeClickEvent(button));

    expect(STATE.currentImageElement).toBeNull();
    expect(showDialog).not.toHaveBeenCalled();
  });

  it('opens the dialog for a resolvable, not-currently-shown image', async () => {
    const { imageListItemSourceMap, onImageListItemClick, STATE } =
      await importOnImageListItemClick();
    const button = document.createElement('button');
    const image = document.createElement('img');

    imageListItemSourceMap.set(button, image);
    STATE.currentImageElement = null;

    onImageListItemClick(makeClickEvent(button));

    expect(STATE.currentImageElement).toBe(image);
    expect(showDialog).toHaveBeenCalledWith({ useCache: true });
  });

  it('does not re-open the dialog when the clicked item is already the current one', async () => {
    const { imageListItemSourceMap, onImageListItemClick, STATE } =
      await importOnImageListItemClick();
    const button = document.createElement('button');
    const image = document.createElement('img');

    button.setAttribute('aria-current', 'true');
    imageListItemSourceMap.set(button, image);
    STATE.currentImageElement = null;

    onImageListItemClick(makeClickEvent(button));

    expect(STATE.currentImageElement).toBe(image);
    expect(showDialog).not.toHaveBeenCalled();
  });
});
