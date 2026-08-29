import { afterEach, describe, expect, it, vi } from 'vitest';

const importInitCanvas = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const { initCanvas } = await import('@/contexts/content-scripts/effects/canvas');
  const { CONTENT_UI } = await import('@/contexts/content-scripts/ui');

  document.body.appendChild(CONTENT_UI.canvas);

  return { initCanvas, CONTENT_UI };
};

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('initCanvas', () => {
  it('wires the shared canvas to contain a nested space element', async () => {
    const { initCanvas, CONTENT_UI } = await importInitCanvas();

    initCanvas();

    expect(CONTENT_UI.canvas.id).toBe('canvas');
    expect(CONTENT_UI.spaceElement.id).toBe('canvas-inner');
    expect(CONTENT_UI.canvas.contains(CONTENT_UI.spaceElement)).toBe(true);
  });

  it('drags the canvas by scrolling relative to the mousedown origin while the primary button is held', async () => {
    const { initCanvas, CONTENT_UI } = await importInitCanvas();
    const { canvas } = CONTENT_UI;
    const scroll = vi.fn();

    initCanvas();
    canvas.scroll = scroll;
    canvas.scrollLeft = 10;
    canvas.scrollTop = 20;

    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 80, clientY: 150 }));

    expect(scroll).toHaveBeenCalledWith({ top: 20 + 200 - 150, left: 10 + 100 - 80 });
  });

  it('ignores mousedown from a non-primary button', async () => {
    const { initCanvas, CONTENT_UI } = await importInitCanvas();
    const { canvas } = CONTENT_UI;
    const scroll = vi.fn();

    initCanvas();
    canvas.scroll = scroll;

    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 1, clientX: 0, clientY: 0 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 999, clientY: 999 }));

    expect(scroll).not.toHaveBeenCalled();
  });

  it('stops tracking mousemove once the mouse button is released', async () => {
    const { initCanvas, CONTENT_UI } = await importInitCanvas();
    const { canvas } = CONTENT_UI;
    const scroll = vi.fn();

    initCanvas();
    canvas.scroll = scroll;

    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0 }));
    window.dispatchEvent(new MouseEvent('mouseup'));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }));

    expect(scroll).not.toHaveBeenCalled();
  });

  it('stops tracking mousemove once the mouse leaves the window', async () => {
    const { initCanvas, CONTENT_UI } = await importInitCanvas();
    const { canvas } = CONTENT_UI;
    const scroll = vi.fn();

    initCanvas();
    canvas.scroll = scroll;

    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0 }));
    window.dispatchEvent(new MouseEvent('mouseleave'));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }));

    expect(scroll).not.toHaveBeenCalled();
  });
});
