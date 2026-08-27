import { afterEach, describe, expect, it, vi } from 'vitest';

const importOnContextmenu = async () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

  const [{ onContextmenu }, { CONTENT_UI }, { STATE }] = await Promise.all([
    import('@/contexts/content-scripts/handlers/on-contextmenu'),
    import('@/contexts/content-scripts/ui'),
    import('@/contexts/content-scripts/state'),
  ]);

  return { onContextmenu, CONTENT_UI, STATE };
};

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('onContextmenu', () => {
  it('clears the tracked image and does not throw when the event has no target', async () => {
    const { onContextmenu, STATE } = await importOnContextmenu();

    expect(() => onContextmenu({ target: null } as unknown as MouseEvent)).not.toThrow();

    expect(STATE.currentImageElement).toBeNull();
  });

  it('clears the tracked image when the target is not an element', async () => {
    const { onContextmenu, STATE } = await importOnContextmenu();
    const textNode = document.createTextNode('not an element');

    onContextmenu({ target: textNode } as unknown as MouseEvent);

    expect(STATE.currentImageElement).toBeNull();
  });

  it('keeps returning the already-tracked image when the contextmenu fires on the viewer host', async () => {
    const { onContextmenu, CONTENT_UI, STATE } = await importOnContextmenu();
    const img = document.createElement('img');
    document.body.appendChild(img);
    onContextmenu({ target: img } as unknown as MouseEvent);
    expect(STATE.currentImageElement).toBe(img);

    onContextmenu({ target: CONTENT_UI.imageViewer } as unknown as MouseEvent);

    expect(STATE.currentImageElement).toBe(img);
  });

  it('does not resolve an image for a node detached from the document', async () => {
    const { onContextmenu, STATE } = await importOnContextmenu();
    const detached = document.createElement('div');

    onContextmenu({ target: detached } as unknown as MouseEvent);

    expect(STATE.currentImageElement).toBeNull();
  });

  it('resolves an image via an ancestor whose own inline style matches the selector', async () => {
    const { onContextmenu, STATE } = await importOnContextmenu();
    const ancestor = document.createElement('div');
    ancestor.style.backgroundImage = 'url("https://example.com/x.png")';
    const target = document.createElement('span');
    ancestor.appendChild(target);
    document.body.appendChild(ancestor);

    onContextmenu({ target } as unknown as MouseEvent);

    expect(STATE.currentImageElement).toBeInstanceOf(HTMLImageElement);
  });

  it('resolves an image via a focusable/semantic ancestor when the image sits in a sibling branch', async () => {
    const { onContextmenu, STATE } = await importOnContextmenu();
    const roleAncestor = document.createElement('div');
    roleAncestor.setAttribute('role', 'button');
    const branch = document.createElement('div');
    const target = document.createElement('span');
    branch.appendChild(target);
    const pic = document.createElement('img');
    roleAncestor.append(branch, pic);
    document.body.appendChild(roleAncestor);

    onContextmenu({ target } as unknown as MouseEvent);

    expect(STATE.currentImageElement).toBe(pic);
  });

  it('gives up after walking 100 ancestors without finding an image', async () => {
    const { onContextmenu, STATE } = await importOnContextmenu();
    let current: HTMLElement = document.body;

    for (let i = 0; i < 150; i++) {
      const div = document.createElement('div');
      current.appendChild(div);
      current = div;
    }

    const target = document.createElement('span');
    current.appendChild(target);

    onContextmenu({ target } as unknown as MouseEvent);

    expect(STATE.currentImageElement).toBeNull();
  });
});
