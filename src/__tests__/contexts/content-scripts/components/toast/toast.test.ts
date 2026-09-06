import { afterEach, describe, expect, it, vi } from 'vitest';

const importToast = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { buildToast, renderToast } = await import('@/contexts/content-scripts/components/toast');
  const { CONTENT_UI } = await import('@/contexts/content-scripts/ui');

  return { buildToast, renderToast, CONTENT_UI };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('buildToast', () => {
  it('builds a toast element carrying the given message', async () => {
    const { buildToast } = await importToast();

    const toast = buildToast({ message: 'hello' });

    expect(toast.className).toBe('toast');
    expect(toast.textContent).toBe('hello');
  });
});

describe('renderToast', () => {
  it('appends the toast to the shared toast container', async () => {
    const { renderToast, CONTENT_UI } = await importToast();

    renderToast({ message: 'hello' });

    expect(CONTENT_UI.toastContainer.querySelector('.toast')?.textContent).toBe('hello');
  });

  it('removes the toast once its fade animation finishes', async () => {
    const { renderToast, CONTENT_UI } = await importToast();

    renderToast({ message: 'hello' });
    const toast = CONTENT_UI.toastContainer.querySelector('.toast');

    toast?.dispatchEvent(new Event('animationend'));

    expect(CONTENT_UI.toastContainer.querySelector('.toast')).toBeNull();
  });
});
