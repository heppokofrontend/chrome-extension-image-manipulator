import { afterEach, describe, expect, it, vi } from 'vitest';

const importBuildDialogElement = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { buildDialogElement } = await import('@/contexts/content-scripts/ui');

  return { buildDialogElement };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('buildDialogElement', () => {
  it('builds an accessible dialog labeled with the extension name', async () => {
    const { buildDialogElement } = await importBuildDialogElement();

    const dialog = buildDialogElement();

    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog.role).toBe('dialog');
    expect(dialog.ariaModal).toBe('true');
    expect(dialog.ariaLabel).toBe('extName');
  });

  it('closes the dialog on the legacy "ESC" key value', async () => {
    const { buildDialogElement } = await importBuildDialogElement();

    const dialog = buildDialogElement();
    const close = vi.fn();
    dialog.close = close;

    const event = new KeyboardEvent('keydown', { key: 'ESC', cancelable: true, bubbles: true });
    const stopPropagation = vi.spyOn(event, 'stopPropagation');
    dialog.dispatchEvent(event);

    expect(close).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
    expect(stopPropagation).toHaveBeenCalled();
  });

  it('does not close the dialog for any other key', async () => {
    const { buildDialogElement } = await importBuildDialogElement();

    const dialog = buildDialogElement();
    const close = vi.fn();
    dialog.close = close;

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(close).not.toHaveBeenCalled();
  });
});
