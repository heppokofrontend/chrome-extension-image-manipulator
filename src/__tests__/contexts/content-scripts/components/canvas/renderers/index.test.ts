import { describe, expect, it, vi } from 'vitest';

import { buildCanvas } from '@/contexts/content-scripts/components/canvas/renderers';

describe('buildCanvas', () => {
  it('builds a canvas element containing a nested space element', () => {
    const { canvas, spaceElement } = buildCanvas();

    expect(canvas.id).toBe('canvas');
    expect(spaceElement.id).toBe('canvas-inner');
    expect(canvas.contains(spaceElement)).toBe(true);
  });

  it('drags the canvas by scrolling relative to the mousedown origin while the primary button is held', () => {
    const { canvas } = buildCanvas();
    const scroll = vi.fn();
    canvas.scroll = scroll;
    canvas.scrollLeft = 10;
    canvas.scrollTop = 20;

    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 80, clientY: 150 }));

    expect(scroll).toHaveBeenCalledWith({ top: 20 + 200 - 150, left: 10 + 100 - 80 });
  });

  it('ignores mousedown from a non-primary button', () => {
    const { canvas } = buildCanvas();
    const scroll = vi.fn();
    canvas.scroll = scroll;

    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 1, clientX: 0, clientY: 0 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 999, clientY: 999 }));

    expect(scroll).not.toHaveBeenCalled();
  });

  it('stops tracking mousemove once the mouse button is released', () => {
    const { canvas } = buildCanvas();
    const scroll = vi.fn();
    canvas.scroll = scroll;

    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0 }));
    window.dispatchEvent(new MouseEvent('mouseup'));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }));

    expect(scroll).not.toHaveBeenCalled();
  });

  it('stops tracking mousemove once the mouse leaves the window', () => {
    const { canvas } = buildCanvas();
    const scroll = vi.fn();
    canvas.scroll = scroll;

    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0 }));
    window.dispatchEvent(new MouseEvent('mouseleave'));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }));

    expect(scroll).not.toHaveBeenCalled();
  });
});
