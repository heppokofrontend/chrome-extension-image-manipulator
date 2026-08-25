import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MessageListener = (
  message: { menuItemId: string },
  sender: unknown,
  sendResponse: (response: boolean) => void,
) => boolean | undefined;

const importContentScripts = async () => {
  let messageListener: MessageListener | undefined;

  vi.stubGlobal('chrome', {
    i18n: { getMessage: (key: string) => key },
    storage: {
      local: {
        get: (_key: string, callback: (items: { background?: string }) => void) => callback({}),
        set: () => Promise.resolve(),
      },
    },
    runtime: {
      onMessage: {
        addListener: (listener: MessageListener) => {
          messageListener = listener;
        },
      },
    },
  });

  await import('@/contexts/content-scripts');

  if (!messageListener) {
    throw new Error('chrome.runtime.onMessage listener was not registered');
  }

  return { messageListener };
};

const rightClick = (target: Element) => {
  target.dispatchEvent(new Event('contextmenu', { bubbles: true }));
};

const patchPrototypeMethod = <T extends object, K extends keyof T>(
  target: T,
  key: K,
  implementation: T[K],
) => {
  const original = Object.getOwnPropertyDescriptor(target, key);

  target[key] = implementation;

  return () => {
    if (original) {
      Object.defineProperty(target, key, original);
    } else {
      Reflect.deleteProperty(target, key);
    }
  };
};

const flushAsyncWork = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('content-scripts entry point', () => {
  it('mounts a closed-shadow custom element into the document body', async () => {
    await importContentScripts();

    const host = document.body.querySelector('heppokofrontend-imagemanipulator');

    expect(host).not.toBeNull();
    expect(host?.shadowRoot).toBeNull();
  });

  it('registers a chrome.runtime message listener that always acknowledges the message', async () => {
    const { messageListener } = await importContentScripts();
    const sendResponse = vi.fn();

    const result = messageListener({ menuItemId: 'reset-all' }, {}, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith(true);
    expect(result).toBe(true);
  });
});

describe('contextmenu target resolution', () => {
  it('captures the pre-manipulation style of a right-clicked image on first contextmenu', async () => {
    await importContentScripts();

    const img = document.createElement('img');
    img.setAttribute('style', 'width: 10px;');
    document.body.appendChild(img);

    rightClick(img);

    expect(img.dataset['imageManipulatorDefaultStyle']).toBe('width: 10px;');
  });

  it('resolves to the single descendant image when right-clicking a wrapping element', async () => {
    await importContentScripts();

    const wrapper = document.createElement('a');
    const img = document.createElement('img');
    img.setAttribute('style', 'width: 20px;');
    wrapper.appendChild(img);
    document.body.appendChild(wrapper);

    rightClick(wrapper);

    expect(img.dataset['imageManipulatorDefaultStyle']).toBe('width: 20px;');
  });

  it('does not capture a style for a contextmenu with no resolvable image', async () => {
    await importContentScripts();

    const plainDiv = document.createElement('div');
    document.body.appendChild(plainDiv);

    rightClick(plainDiv);

    expect(plainDiv.dataset['imageManipulatorDefaultStyle']).toBeUndefined();
  });
});

describe('applying style changes via the context menu message', () => {
  it('scales the current image for a "<n>%" menu item', async () => {
    const { messageListener } = await importContentScripts();
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    messageListener({ menuItemId: '150%' }, {}, vi.fn());

    expect(img.style.transform).toContain('scale(1.5)');
  });

  it('rotates the current image for a "<n>deg" menu item', async () => {
    const { messageListener } = await importContentScripts();
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    messageListener({ menuItemId: '90deg' }, {}, vi.fn());

    expect(img.style.transform).toContain('rotateZ(90deg)');
  });

  it('flips the current image for the "reverse" menu item', async () => {
    const { messageListener } = await importContentScripts();
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    messageListener({ menuItemId: 'reverse' }, {}, vi.fn());

    expect(img.style.transform).toContain('rotateY(180deg)');
  });

  it('restores the pre-manipulation style for the "reset" menu item', async () => {
    const { messageListener } = await importContentScripts();
    const img = document.createElement('img');
    img.setAttribute('style', 'width: 30px;');
    document.body.appendChild(img);
    rightClick(img);

    messageListener({ menuItemId: '90deg' }, {}, vi.fn());
    expect(img.getAttribute('style')).not.toBe('width: 30px;');

    messageListener({ menuItemId: 'reset' }, {}, vi.fn());

    expect(img.getAttribute('style')).toBe('width: 30px;');
  });

  it('restores every captured image style for the "reset-all" menu item, independent of the current target', async () => {
    const { messageListener } = await importContentScripts();
    const imgA = document.createElement('img');
    const imgB = document.createElement('img');
    imgA.setAttribute('style', 'width: 40px;');
    imgB.setAttribute('style', 'width: 50px;');
    document.body.append(imgA, imgB);
    rightClick(imgA);
    rightClick(imgB);

    messageListener({ menuItemId: '90deg' }, {}, vi.fn());
    messageListener({ menuItemId: 'reset-all' }, {}, vi.fn());

    expect(imgA.getAttribute('style')).toBe('width: 40px;');
    expect(imgB.getAttribute('style')).toBe('width: 50px;');
  });
});

describe('opening the dialog via the context menu message', () => {
  let restoreFns: Array<() => void> = [];

  beforeEach(() => {
    restoreFns = [
      patchPrototypeMethod(
        HTMLDialogElement.prototype,
        'showModal',
        function (this: HTMLDialogElement) {
          this.open = true;
        },
      ),
      patchPrototypeMethod(
        HTMLDialogElement.prototype,
        'close',
        function (this: HTMLDialogElement) {
          this.open = false;
        },
      ),
      patchPrototypeMethod(Element.prototype, 'scroll', function () {}),
    ];

    const originalSrcDescriptor = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      'src',
    )!;
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: true,
      get(this: HTMLImageElement) {
        return originalSrcDescriptor.get!.call(this) as string;
      },
      set(this: HTMLImageElement, value: string) {
        originalSrcDescriptor.set!.call(this, value);
        queueMicrotask(() => this.dispatchEvent(new Event('load')));
      },
    });
    restoreFns.push(() => {
      Object.defineProperty(HTMLImageElement.prototype, 'src', originalSrcDescriptor);
    });
  });

  afterEach(() => {
    restoreFns.forEach((restore) => restore());
  });

  it('opens the dialog for the "dialog" menu item without throwing, acknowledging the message synchronously', async () => {
    const { messageListener } = await importContentScripts();
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    document.body.appendChild(img);
    rightClick(img);

    const sendResponse = vi.fn();
    const result = messageListener({ menuItemId: 'dialog' }, {}, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith(true);
    expect(result).toBe(true);

    await flushAsyncWork();
  });
});
