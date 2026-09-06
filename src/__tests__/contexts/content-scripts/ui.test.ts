import { afterEach, describe, expect, it, vi } from 'vitest';

const importBuildDialogElement = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { buildDialogElement } = await import('@/contexts/content-scripts/ui');

  return { buildDialogElement };
};

const importBuildToastContainer = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { buildToastContainer } = await import('@/contexts/content-scripts/ui');

  return { buildToastContainer };
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

  it('stops propagation for the Escape key without manually closing the dialog', async () => {
    const { buildDialogElement } = await importBuildDialogElement();

    const dialog = buildDialogElement();
    const close = vi.fn();
    dialog.close = close;

    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true });
    const stopPropagation = vi.spyOn(event, 'stopPropagation');
    dialog.dispatchEvent(event);

    // closedBy="closerequest" によるネイティブクローズに任せるため、
    // preventDefault/close は呼ばない(呼ぶとネイティブの既定動作を妨げてしまう)
    expect(stopPropagation).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    expect(close).not.toHaveBeenCalled();
  });

  it('does not stop propagation for any other key', async () => {
    const { buildDialogElement } = await importBuildDialogElement();

    const dialog = buildDialogElement();
    const close = vi.fn();
    dialog.close = close;

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    const stopPropagation = vi.spyOn(event, 'stopPropagation');
    dialog.dispatchEvent(event);

    expect(stopPropagation).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });
});

describe('buildToastContainer', () => {
  it('announces its content to assistive technology as a polite status region', async () => {
    const { buildToastContainer } = await importBuildToastContainer();

    const toastContainer = buildToastContainer();

    expect(toastContainer.role).toBe('status');
    expect(toastContainer.ariaLive).toBe('polite');
  });
});
