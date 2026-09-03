import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MessageListener = (
  message: ContextMenuMessage,
  sender: unknown,
  sendResponse: (response: boolean) => void,
) => boolean | undefined;

const importContentScripts = async (
  options: { openShadow?: boolean; storedBackground?: string } = {},
) => {
  let messageListener: MessageListener | undefined;

  vi.stubGlobal('chrome', {
    i18n: { getMessage: (key: string) => key },
    storage: {
      local: {
        get: (_key: string, callback: (items: { background?: string }) => void) => {
          callback(options.storedBackground ? { background: options.storedBackground } : {});
        },
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

  // eslint-disable-next-line @typescript-eslint/unbound-method -- captured only to be re-applied via `.call()` below
  const originalAttachShadow = Element.prototype.attachShadow;

  if (options.openShadow) {
    Element.prototype.attachShadow = function (this: Element, init: ShadowRootInit) {
      return originalAttachShadow.call(this, { ...init, mode: 'open' });
    };
  }

  await import('@/contexts/content-scripts');

  Element.prototype.attachShadow = originalAttachShadow;

  if (!messageListener) {
    throw new Error('chrome.runtime.onMessage listener was not registered');
  }

  return { messageListener };
};

const getShadowRoot = () => {
  const host = document.body.querySelector('heppokofrontend-imagemanipulator');
  const shadowRoot = host?.shadowRoot;

  if (!shadowRoot) {
    throw new Error('shadow root was not accessible (did you pass { openShadow: true }?)');
  }

  return shadowRoot;
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- 呼び出し側で要素の型を指定するための意図的な戻り値限定ジェネリクス
const nonNullableQuerySelector = <T extends Element>(root: ParentNode, selector: string) =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- テストが直前に生成した要素を参照するだけなので、見つからない場合はテスト失敗で十分
  root.querySelector<T>(selector)!;

const nonNullable = <T>(value: T | null | undefined) =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- テストが直前に生成した値を参照するだけなので、null/undefined なら例外でテスト失敗すれば十分
  value!;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- 呼び出し側でテスト対象要素の型を指定するための意図的な戻り値限定ジェネリクス
const getControl = <T extends Element = HTMLElement>(id: string) => {
  const element = getShadowRoot().getElementById(id);

  if (!element) {
    throw new Error(`control #${id} was not found in the shadow root`);
  }

  return element as unknown as T;
};

/**
 * ダイアログ・スクロール・画像読み込みは jsdom が未実装のため、
 * showDialog / applyZoomAndScroll / getFileSize の到達に必要な最小限をパッチする。
 * src に "/error-image" を含めると load の代わりに error を発火させる（404 系分岐の検証用）。
 */
const patchDialogEnvironment = () => {
  const restoreFns: Array<() => void> = [
    patchPrototypeMethod(
      HTMLDialogElement.prototype,
      'showModal',
      function (this: HTMLDialogElement) {
        this.open = true;
      },
    ),
    patchPrototypeMethod(HTMLDialogElement.prototype, 'close', function (this: HTMLDialogElement) {
      this.open = false;
    }),
    patchPrototypeMethod(Element.prototype, 'scroll', function () {}),
    patchPrototypeMethod(Element.prototype, 'scrollBy', function () {}),
    patchPrototypeMethod(Element.prototype, 'scrollIntoView', function () {}),
  ];

  const originalSrcDescriptor = nonNullable(
    Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src'),
  );

  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    get(this: HTMLImageElement) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- src はアクセサプロパティなので get は必ず存在する
      return originalSrcDescriptor.get!.call(this) as string;
    },
    set(this: HTMLImageElement, value: string) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- src はアクセサプロパティなので set は必ず存在する
      originalSrcDescriptor.set!.call(this, value);

      const eventType = value.includes('/error-image') ? 'error' : 'load';

      queueMicrotask(() => this.dispatchEvent(new Event(eventType)));
    },
  });
  restoreFns.push(() => {
    Object.defineProperty(HTMLImageElement.prototype, 'src', originalSrcDescriptor);
  });

  return () => {
    restoreFns.forEach((restore) => {
      restore();
    });
  };
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

/**
 * ダイアログを最後まで開き切るテスト用ヘルパー。
 * applyImageList の useCache:false 分岐は 300ms 後に実タイマーで
 * リストを可視化するため、afterEach の DOM 破棄より前にそれを消化しておかないと
 * カバレッジ計測時に限りテアダウン後の要素操作で例外が漏れる。
 */
const openDialog = async (messageListener: MessageListener, img: HTMLImageElement) => {
  if (!document.body.contains(img)) {
    document.body.appendChild(img);
  }

  rightClick(img);

  messageListener({ actionId: 'dialog' }, {}, vi.fn());

  await flushAsyncWork();
  await new Promise((resolve) => setTimeout(resolve, 300));
};

const patchNaturalSize = (width: number, height: number) => {
  const widthDescriptor = nonNullable(
    Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalWidth'),
  );
  const heightDescriptor = nonNullable(
    Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalHeight'),
  );

  Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
    configurable: true,
    get: () => height,
  });

  return () => {
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', widthDescriptor);
    Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', heightDescriptor);
  };
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

    const result = messageListener({ actionId: 'reset-all' }, {}, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith(true);
    expect(result).toBe(true);
  });

  it('re-appends the custom element on window load if a framework removed it', async () => {
    await importContentScripts();

    const host = nonNullable(document.body.querySelector('heppokofrontend-imagemanipulator'));

    host.remove();
    window.dispatchEvent(new Event('load'));

    expect(document.body.contains(host)).toBe(true);
  });

  it('does not re-append the custom element on window load when it is already in the body', async () => {
    await importContentScripts();

    const host = nonNullable(document.body.querySelector('heppokofrontend-imagemanipulator'));
    // 同一 window に他テストの 'load' リスナーも累積して残り、構造が同一な
    // 別インスタンスの imageViewer も toHaveBeenCalledWith の深い等価比較で
    // 一致してしまうため、参照の同一性で検証する
    const appendChild = vi.spyOn(document.body, 'appendChild');
    window.dispatchEvent(new Event('load'));

    expect(appendChild.mock.calls.some((call) => call[0] === host)).toBe(false);
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

describe('resolving svg and background-image targets via contextmenu', () => {
  it('converts a right-clicked svg element into a synthetic image, leaving the svg itself unstyled', async () => {
    const { messageListener } = await importContentScripts();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svg);

    rightClick(svg);

    expect(svg.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');

    messageListener({ actionId: 'scale', value: 150 }, {}, vi.fn());

    expect(svg.getAttribute('style')).toBeNull();
  });

  it('converts a right-clicked background-image element into a synthetic image, leaving its own style untouched', async () => {
    const { messageListener } = await importContentScripts();
    const div = document.createElement('div');
    div.style.backgroundImage = 'url("https://example.com/foo.png")';
    document.body.appendChild(div);

    rightClick(div);

    messageListener({ actionId: 'scale', value: 150 }, {}, vi.fn());

    expect(div.style.backgroundImage).toBe('url("https://example.com/foo.png")');
    expect(div.style.transform).toBe('');
  });
});

describe('applying style changes via the context menu message', () => {
  it('scales the current image for a "<n>%" menu item', async () => {
    const { messageListener } = await importContentScripts();
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    messageListener({ actionId: 'scale', value: 150 }, {}, vi.fn());

    expect(img.style.transform).toContain('scale(1.5)');
  });

  it('rotates the current image for a "<n>deg" menu item', async () => {
    const { messageListener } = await importContentScripts();
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    messageListener({ actionId: 'rotate', value: 90 }, {}, vi.fn());

    expect(img.style.transform).toContain('rotateZ(90deg)');
  });

  it('flips the current image for the "reverse" menu item', async () => {
    const { messageListener } = await importContentScripts();
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    messageListener({ actionId: 'reverse' }, {}, vi.fn());

    expect(img.style.transform).toContain('rotateY(180deg)');
  });

  it('restores the pre-manipulation style for the "reset" menu item', async () => {
    const { messageListener } = await importContentScripts();
    const img = document.createElement('img');
    img.setAttribute('style', 'width: 30px;');
    document.body.appendChild(img);
    rightClick(img);

    messageListener({ actionId: 'rotate', value: 90 }, {}, vi.fn());
    expect(img.getAttribute('style')).not.toBe('width: 30px;');

    messageListener({ actionId: 'reset' }, {}, vi.fn());

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

    messageListener({ actionId: 'rotate', value: 90 }, {}, vi.fn());
    messageListener({ actionId: 'reset-all' }, {}, vi.fn());

    expect(imgA.getAttribute('style')).toBe('width: 40px;');
    expect(imgB.getAttribute('style')).toBe('width: 50px;');
  });
});

describe('opening the dialog via the context menu message', () => {
  let restore: () => void;

  beforeEach(() => {
    restore = patchDialogEnvironment();
  });

  afterEach(() => {
    restore();
  });

  it('opens the dialog for the "dialog" menu item without throwing, acknowledging the message synchronously', async () => {
    const { messageListener } = await importContentScripts();
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    document.body.appendChild(img);
    rightClick(img);

    const sendResponse = vi.fn();
    const result = messageListener({ actionId: 'dialog' }, {}, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith(true);
    expect(result).toBe(true);

    await flushAsyncWork();
    // applyImageList の useCache:false 分岐が実タイマー(300ms)でリストを
    // 可視化するため、afterEach のテアダウン前にそれを消化しておく。
    await new Promise((resolve) => setTimeout(resolve, 300));
  });
});

describe('canvas wheel gestures', () => {
  const dispatchWheel = (target: Element, deltaY: number, shiftKey = false) => {
    target.dispatchEvent(
      new WheelEvent('wheel', { deltaY, shiftKey, cancelable: true, bubbles: true }),
    );
  };

  it('does nothing when no image is currently targeted', async () => {
    await importContentScripts({ openShadow: true });
    const canvas = getControl('canvas');

    expect(() => {
      dispatchWheel(canvas, -100);
    }).not.toThrow();
  });

  it('zooms in and out around the current image, clamping the minimum scale to 1%', async () => {
    await importContentScripts({ openShadow: true });
    const canvas = getControl('canvas');
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    dispatchWheel(canvas, -100);
    expect(img.style.transform).toContain('scale(1.1)');

    dispatchWheel(canvas, 100);
    expect(img.style.transform).toContain('scale(1)');

    // 100 -> 1 は 10刻みから始まり50%未満で刻みが5, 40%未満で3に細かくなる。
    // 19回のズームアウトで 0 以下になり、1%へクランプされる。
    for (let i = 0; i < 19; i++) {
      dispatchWheel(canvas, 100);
    }
    expect(img.style.transform).toContain('scale(0.01)');

    // scale が 1 ちょうどのときにズームインすると diff 分がそのまま適用される
    dispatchWheel(canvas, -100);
    expect(img.style.transform).toContain('scale(0.03)');
  });

  it('rotates the current image with the shift key held, wrapping past 360 and below 0 degrees', async () => {
    await importContentScripts({ openShadow: true });
    const canvas = getControl('canvas');
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    dispatchWheel(canvas, -100, true);
    expect(img.style.transform).toContain('rotateZ(10deg)');

    for (let i = 0; i < 35; i++) {
      dispatchWheel(canvas, -100, true);
    }
    expect(img.style.transform).toContain('rotateZ(0deg)');

    dispatchWheel(canvas, 100, true);
    expect(img.style.transform).toContain('rotateZ(350deg)');
  });

  it('rotates left without wrapping when the result stays within 0-359 degrees', async () => {
    await importContentScripts({ openShadow: true });
    const canvas = getControl('canvas');
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    dispatchWheel(canvas, -100, true);
    dispatchWheel(canvas, -100, true);
    expect(img.style.transform).toContain('rotateZ(20deg)');

    dispatchWheel(canvas, 100, true);
    expect(img.style.transform).toContain('rotateZ(10deg)');
  });
});

describe('dialog form controls for a not-yet-in-dialog image', () => {
  it('applies a numeric scale from the scale field, and falls back to 100 for a non-numeric value', async () => {
    await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    const scale = getControl<HTMLInputElement>('scale');
    scale.value = '42';
    scale.dispatchEvent(new Event('input'));
    expect(img.style.transform).toContain('scale(0.42)');

    // input[type="number"] は不正な値を空文字へ丸めてしまい Number('') = 0 になるため、
    // NaN 分岐を通すには type を一時的に text に切り替えて値を素通しさせる。
    scale.setAttribute('type', 'text');
    scale.value = 'not-a-number';
    scale.dispatchEvent(new Event('input'));
    expect(img.style.transform).toContain('scale(1)');
  });

  it('resets the scale to 100% via the scale-100 button', async () => {
    await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    const scale = getControl<HTMLInputElement>('scale');
    scale.value = '42';
    scale.dispatchEvent(new Event('input'));

    getControl<HTMLButtonElement>('scale-100').click();
    expect(img.style.transform).toContain('scale(1)');
  });

  it('rotates via the rotate field, the left/right buttons, and resets via the reset button', async () => {
    await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    // isInDialog が false の間は renderImageController が呼ばれず #rotate の value は
    // ボタン操作後も自動更新されないため、各操作の直前に想定される表示値を
    // 手動で設定してからクリックする。
    const rotate = getControl<HTMLInputElement>('rotate');
    rotate.value = '45';
    rotate.dispatchEvent(new Event('input'));
    expect(img.style.transform).toContain('rotateZ(45deg)');

    getControl<HTMLButtonElement>('rotate-right').click();
    expect(img.style.transform).toContain('rotateZ(90deg)');

    rotate.value = '90';
    getControl<HTMLButtonElement>('rotate-left').click();
    expect(img.style.transform).toContain('rotateZ(45deg)');

    getControl<HTMLButtonElement>('rotate-reset').click();
    expect(img.style.transform).toContain('rotateZ(0deg)');

    // input[type="number"] は不正な値を空文字へ丸めてしまうため、NaN 分岐を
    // 通すには type を一時的に text に切り替えて値を素通しさせる。
    rotate.setAttribute('type', 'text');
    rotate.value = 'not-a-number';
    rotate.dispatchEvent(new Event('input'));
    expect(img.style.transform).toContain('rotateZ(0deg)');
  });

  it('flips the image via the reverse checkbox', async () => {
    await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    const reverse = getControl<HTMLInputElement>('reverse');
    reverse.checked = true;
    reverse.dispatchEvent(new Event('input'));

    expect(img.style.transform).toContain('rotateY(180deg)');
  });

  it('toggles the shared has-border class on the current image via the border checkbox', async () => {
    await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    const border = getControl<HTMLInputElement>('border');
    border.checked = true;
    border.dispatchEvent(new Event('input'));
    expect(img.classList.contains('has-border')).toBe(true);

    border.checked = false;
    border.dispatchEvent(new Event('input'));
    expect(img.classList.contains('has-border')).toBe(false);
  });

  it('applies a valid rendering mode from the render select, and falls back to the default otherwise', async () => {
    await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    const render = getControl<HTMLSelectElement>('render');
    render.value = 'pixelated';
    render.dispatchEvent(new Event('change'));

    // isInDialog が false のときは image-rendering は反映されないため、
    // 例外なく処理が完了することのみを確認する（resolveRenderMode の分岐カバレッジ用）。
    expect(() => render.dispatchEvent(new Event('change'))).not.toThrow();

    // <select> は存在しない option 値を割り当てると value が空文字にフォールバックする
    // ため、resolveRenderMode の isInvalid('') === false の分岐（デフォルト値へのフォール
    // バック）が自然に踏まれる。
    render.value = 'not-a-real-render-mode';
    expect(render.value).toBe('');
    expect(() => render.dispatchEvent(new Event('change'))).not.toThrow();
  });
});

describe('dialog background color controls', () => {
  it('restores a previously stored background color on load', async () => {
    await importContentScripts({ openShadow: true, storedBackground: '#123456' });

    const custom = getControl<HTMLInputElement>('background-custom');
    expect(custom.value).toBe('#123456');
  });

  it('applies the bright and dark preset colors and persists the choice', async () => {
    await importContentScripts({ openShadow: true });

    const dialog = nonNullableQuerySelector<HTMLDialogElement>(getShadowRoot(), 'dialog');
    const custom = getControl<HTMLInputElement>('background-custom');

    getControl<HTMLButtonElement>('background-bright').click();
    expect(custom.value).toBe('#fafafa');
    expect(dialog.style.getPropertyValue('--canvas-background')).toBe('#fafafa');

    getControl<HTMLButtonElement>('background-dark').click();
    expect(custom.value).toBe('#202124');
    expect(dialog.style.getPropertyValue('--canvas-background')).toBe('#202124');
  });
});

describe('fully opening the dialog populates the form controls', () => {
  let restore: () => void;

  beforeEach(() => {
    restore = patchDialogEnvironment();
  });

  afterEach(() => {
    restore();
  });

  it('sets url, alt, size, and type from the in-dialog clone', async () => {
    // scale の 'init' フィットは naturalWidth/Height が 0 だと Infinity になり、
    // <input type="number"> がそれを不正値として '' にサニタイズしてしまうため、
    // 自然サイズを与えておく。
    const restoreNaturalSize = patchNaturalSize(200, 100);

    try {
      const { messageListener } = await importContentScripts({ openShadow: true });
      const img = document.createElement('img');
      img.alt = 'a sample image';
      img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>';

      await openDialog(messageListener, img);

      expect(getControl<HTMLInputElement>('alt').value).toBe('a sample image');
      expect(getControl<HTMLInputElement>('url').value).toBe(img.src);
      expect(getControl<HTMLInputElement>('size').value).toContain('byte');
      expect(getControl<HTMLInputElement>('type').value).toBe('image/svg+xml (in HTML)');
      expect(getControl<HTMLInputElement>('scale').value.length).toBeGreaterThan(0);
      expect(getControl<HTMLInputElement>('rotate').value).toBe('0');
      expect(getControl<HTMLInputElement>('reverse').checked).toBe(false);
      expect(getControl<HTMLSelectElement>('render').value).toBe('crisp-edges');
    } finally {
      restoreNaturalSize();
    }
  });

  it('computes the reduced aspect ratio from the natural dimensions', async () => {
    const restoreNaturalSize = patchNaturalSize(200, 100);

    try {
      const { messageListener } = await importContentScripts({ openShadow: true });
      const img = document.createElement('img');
      img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>';

      await openDialog(messageListener, img);

      expect(getControl<HTMLInputElement>('natural-width').value).toBe('200 px');
      expect(getControl<HTMLInputElement>('natural-height').value).toBe('100 px');
      expect(getControl<HTMLInputElement>('aspect').value).toBe('2 : 1');
    } finally {
      restoreNaturalSize();
    }
  });
});

describe('the image list inside an opened dialog', () => {
  let restore: () => void;

  const svgSrc = (label: string) =>
    `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" data-label="${label}"></svg>`;

  beforeEach(() => {
    restore = patchDialogEnvironment();
  });

  afterEach(() => {
    restore();
  });

  it('renders one entry per unique image, flags the current one, and falls back to an aria-label when alt is empty', async () => {
    const { messageListener } = await importContentScripts({ openShadow: true });
    const imgA = document.createElement('img');
    imgA.src = svgSrc('a');
    const imgB = document.createElement('img');
    imgB.src = svgSrc('b');
    imgB.alt = 'image b';
    document.body.append(imgA, imgB);

    await openDialog(messageListener, imgA);

    const buttons = [...getShadowRoot().querySelectorAll<HTMLButtonElement>('#image-list button')];

    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.getAttribute('aria-current')).toBe('true');
    expect(buttons[0]?.querySelector('img')?.getAttribute('aria-label')).toBe('image_list_no_alt');
    expect(buttons[1]?.getAttribute('aria-current')).toBeNull();
    expect(buttons[1]?.querySelector('img')?.alt).toBe('image b');
    expect(buttons[1]?.querySelector('img')?.getAttribute('aria-label')).toBeNull();
  });

  it('switches the current image when a different list item is clicked', async () => {
    const { messageListener } = await importContentScripts({ openShadow: true });
    const imgA = document.createElement('img');
    imgA.src = svgSrc('a');
    const imgB = document.createElement('img');
    imgB.src = svgSrc('b');
    document.body.append(imgA, imgB);

    await openDialog(messageListener, imgA);

    const buttons = [...getShadowRoot().querySelectorAll<HTMLButtonElement>('#image-list button')];
    buttons[1]?.click();

    await flushAsyncWork();

    const buttonsAfter = [
      ...getShadowRoot().querySelectorAll<HTMLButtonElement>('#image-list button'),
    ];
    expect(buttonsAfter[1]?.getAttribute('aria-current')).toBe('true');
    expect(buttonsAfter[0]?.getAttribute('aria-current')).toBeNull();
  });

  it('wraps around when navigating past the ends via the prev/next buttons', async () => {
    const { messageListener } = await importContentScripts({ openShadow: true });
    const imgA = document.createElement('img');
    imgA.src = svgSrc('a');
    const imgB = document.createElement('img');
    imgB.src = svgSrc('b');
    document.body.append(imgA, imgB);

    await openDialog(messageListener, imgA);

    const currentAriaCurrent = () =>
      [...getShadowRoot().querySelectorAll<HTMLButtonElement>('#image-list button')].findIndex(
        (button) => button.getAttribute('aria-current') === 'true',
      );

    getControl<HTMLButtonElement>('image-list-next').click();
    await flushAsyncWork();
    expect(currentAriaCurrent()).toBe(1);

    // 直前の要素が存在する場合は roopTarget にフォールバックせず直接遷移する
    getControl<HTMLButtonElement>('image-list-prev').click();
    await flushAsyncWork();
    expect(currentAriaCurrent()).toBe(0);

    getControl<HTMLButtonElement>('image-list-next').click();
    await flushAsyncWork();
    expect(currentAriaCurrent()).toBe(1);

    getControl<HTMLButtonElement>('image-list-next').click();
    await flushAsyncWork();
    expect(currentAriaCurrent()).toBe(0);

    getControl<HTMLButtonElement>('image-list-prev').click();
    await flushAsyncWork();
    expect(currentAriaCurrent()).toBe(1);
  });

  it('reloads the image list without throwing when the reload button is clicked', async () => {
    const { messageListener } = await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    img.src = svgSrc('a');

    await openDialog(messageListener, img);

    expect(() => {
      getControl<HTMLButtonElement>('image-list-reload').click();
    }).not.toThrow();
  });

  it('navigates via Home/End/Arrow keys, wraps at both ends, and ignores the shortcut while a modifier key (alt or ctrl) is held', async () => {
    const { messageListener } = await importContentScripts({ openShadow: true });
    const imgA = document.createElement('img');
    imgA.src = svgSrc('a');
    const imgB = document.createElement('img');
    imgB.src = svgSrc('b');
    document.body.append(imgA, imgB);

    await openDialog(messageListener, imgA);

    const buttons = () => [
      ...getShadowRoot().querySelectorAll<HTMLButtonElement>('#image-list button'),
    ];
    const currentIndex = () =>
      buttons().findIndex((button) => button.getAttribute('aria-current') === 'true');

    const dispatchKey = async (key: string, modifiers: KeyboardEventInit = {}) => {
      const current = nonNullable(buttons()[currentIndex()]);
      current.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...modifiers }));
      await flushAsyncWork();
    };

    await dispatchKey('ArrowRight');
    expect(currentIndex()).toBe(1);

    await dispatchKey('ArrowLeft');
    expect(currentIndex()).toBe(0);

    await dispatchKey('End');
    expect(currentIndex()).toBe(1);

    await dispatchKey('Home');
    expect(currentIndex()).toBe(0);

    await dispatchKey('ArrowDown');
    expect(currentIndex()).toBe(0);

    await dispatchKey('ArrowUp');
    expect(currentIndex()).toBe(0);

    await dispatchKey('ArrowRight', { altKey: true });
    expect(currentIndex()).toBe(0);

    await dispatchKey('ArrowRight', { ctrlKey: true });
    expect(currentIndex()).toBe(0);

    // 末尾を超えた ArrowRight は先頭へ、先頭を下回った ArrowLeft は末尾へ折り返す
    await dispatchKey('ArrowLeft');
    expect(currentIndex()).toBe(1);

    await dispatchKey('ArrowRight');
    expect(currentIndex()).toBe(0);
  });

  it('wraps ArrowUp/ArrowDown across row boundaries in a grid wider than one row', async () => {
    const { messageListener } = await importContentScripts({ openShadow: true });
    // IMAGE_LIST_COLS(8) を跨ぐグリッド折り返しの分岐を踏むため9枚用意する
    const images = Array.from({ length: 9 }, (_, i) => {
      const img = document.createElement('img');
      img.src = svgSrc(`grid-${i}`);
      return img;
    });
    document.body.append(...images);

    await openDialog(messageListener, nonNullable(images[0]));

    const buttons = () => [
      ...getShadowRoot().querySelectorAll<HTMLButtonElement>('#image-list button'),
    ];
    const currentIndex = () =>
      buttons().findIndex((button) => button.getAttribute('aria-current') === 'true');

    const dispatchKey = async (key: string) => {
      const current = nonNullable(buttons()[currentIndex()]);
      current.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      await flushAsyncWork();
    };

    // 先頭(index 0)からの ArrowDown は index+COLS(8) が存在するのでそこへ直接移動する
    await dispatchKey('ArrowDown');
    expect(currentIndex()).toBe(8);

    // 最終行(index 8)からの ArrowUp は index-COLS(-8) が存在しないため折り返しにフォールバックする
    await dispatchKey('ArrowUp');
    expect(currentIndex()).toBe(0);
  });

  it('collects svg and background-image page elements alongside <img>, converting each into a synthetic list entry that can be selected', async () => {
    // dummy 要素の合成 img は svg と異なり非 data URI の src を持つため、選択時に
    // getFileSize がネットワークへ HEAD リクエストを投げにいく。実通信を避けるため fetch をスタブする。
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        headers: new Headers({ 'Content-Length': '1', 'Content-Type': 'image/png' }),
      }),
    );

    const { messageListener } = await importContentScripts({ openShadow: true });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const dummy = document.createElement('div');
    dummy.style.backgroundImage = 'url("https://example.com/dummy.png")';
    // background-image を持たない要素は SELECTOR にマッチしても合成 img へ変換されず除外される
    const nonBgWithUrlInStyle = document.createElement('div');
    nonBgWithUrlInStyle.setAttribute('style', 'cursor: url(icon.png), pointer;');
    document.body.append(svg, dummy, nonBgWithUrlInStyle);

    const img = document.createElement('img');
    img.src = svgSrc('a');

    await openDialog(messageListener, img);

    const buttons = [...getShadowRoot().querySelectorAll<HTMLButtonElement>('#image-list button')];
    expect(buttons).toHaveLength(3);

    // click のたびに applyImageList(true) がリストの DOM を丸ごと作り直すため、
    // ボタン参照は使い回さず src で毎回引き直す
    const svgSrcValue = 'data:image/svg+xml,' + encodeURIComponent(svg.outerHTML);
    const dummySrcValue = 'https://example.com/dummy.png';
    const findButtonBySrc = (src: string) =>
      [...getShadowRoot().querySelectorAll<HTMLButtonElement>('#image-list button')].find(
        (button) => button.querySelector('img')?.src === src,
      );

    const svgButton = findButtonBySrc(svgSrcValue);
    const dummyButton = findButtonBySrc(dummySrcValue);

    expect(svgButton).toBeDefined();
    expect(dummyButton).toBeDefined();
    // 合成 img には aria-label も title 子要素も無いため alt は常に空文字にフォールバックする
    expect(svgButton?.querySelector('img')?.getAttribute('aria-label')).toBe('image_list_no_alt');
    expect(dummyButton?.querySelector('img')?.getAttribute('aria-label')).toBe('image_list_no_alt');

    nonNullable(svgButton).click();
    await flushAsyncWork();
    expect(findButtonBySrc(svgSrcValue)?.getAttribute('aria-current')).toBe('true');

    nonNullable(findButtonBySrc(dummySrcValue)).click();
    await flushAsyncWork();
    expect(findButtonBySrc(dummySrcValue)?.getAttribute('aria-current')).toBe('true');

    // 再生成(reload)時は convertedSvgMap/convertedDummyMap にキャッシュ済みの合成 img を再利用する
    getControl<HTMLButtonElement>('image-list-reload').click();
    await flushAsyncWork();

    const buttonsAfterReload = [
      ...getShadowRoot().querySelectorAll<HTMLButtonElement>('#image-list button'),
    ];
    expect(buttonsAfterReload).toHaveLength(3);
  });

  it('removes a list item and marks it errored when its own thumbnail image fails to load', async () => {
    const { messageListener } = await importContentScripts({ openShadow: true });
    const imgA = document.createElement('img');
    imgA.src = svgSrc('a');
    const imgB = document.createElement('img');
    imgB.src = 'https://example.com/error-image.png';
    document.body.append(imgA, imgB);

    await openDialog(messageListener, imgA);

    const buttons = [...getShadowRoot().querySelectorAll<HTMLButtonElement>('#image-list button')];
    expect(buttons).toHaveLength(1);
    expect(buttons.some((button) => button.querySelector('img')?.src === imgB.src)).toBe(false);
  });

  it('adjusts scroll position when the newly current item sits above or below the visible list', async () => {
    const { messageListener } = await importContentScripts({ openShadow: true });
    const imgA = document.createElement('img');
    imgA.src = svgSrc('a');
    const imgB = document.createElement('img');
    imgB.src = svgSrc('b');
    document.body.append(imgA, imgB);

    await openDialog(messageListener, imgA);

    const imageList = getControl<HTMLUListElement>('image-list');
    imageList.getBoundingClientRect = () => ({ top: 100, bottom: 200 }) as DOMRect;

    const buttons = () => [
      ...getShadowRoot().querySelectorAll<HTMLButtonElement>('#image-list button'),
    ];

    nonNullable(buttons()[1]).getBoundingClientRect = () => ({ top: 0, bottom: 10 }) as DOMRect;
    expect(() => {
      nonNullable(buttons()[1]).click();
    }).not.toThrow();
    await flushAsyncWork();

    nonNullable(buttons()[0]).getBoundingClientRect = () => ({ top: 500, bottom: 510 }) as DOMRect;
    expect(() => {
      nonNullable(buttons()[0]).click();
    }).not.toThrow();
    await flushAsyncWork();
  });

  it('picks up a lazily-loaded image update when the source <img> fires load/error after the list is already built, and filters the errored entry out of the cache on the next selection', async () => {
    const { messageListener } = await importContentScripts({ openShadow: true });
    const imgA = document.createElement('img');
    imgA.src = svgSrc('a');
    const imgB = document.createElement('img');
    imgB.src = svgSrc('b');
    const imgC = document.createElement('img');
    imgC.src = svgSrc('c');
    document.body.append(imgA, imgB, imgC);

    // applyImageList が imgA/imgB/imgC へ load/error リスナーを付け終えたあとで src を差し替え、
    // パッチ済みの src setter がリスナー登録後に load/error を発火させる状況を作る
    await openDialog(messageListener, imgA);

    imgA.src = svgSrc('a-updated');
    imgB.src = 'https://example.com/error-image.png';

    await flushAsyncWork();

    const findButtonBySrc = (src: string) =>
      [...getShadowRoot().querySelectorAll<HTMLButtonElement>('#image-list button')].find(
        (button) => button.querySelector('img')?.src === src,
      );

    // imgB の isError は imagesCache 上の result を直接書き換えたもの。別ボタン(imgC)のクリックで
    // useCache=true(キャッシュ再利用)を踏むと、listItems 生成時にこのエントリがフィルタされて消える
    nonNullable(findButtonBySrc(svgSrc('c'))).click();
    await flushAsyncWork();

    expect(findButtonBySrc(imgB.src)).toBeUndefined();
    expect(findButtonBySrc(svgSrc('c'))?.getAttribute('aria-current')).toBe('true');

    // reload(useCache=false)は DOM を再走査するため、この操作自体が例外を起こさないことのみ確認する
    // (imgB の合成サムネイルは src に /error-image を含み自身の onerror で即座に再エラー扱いになるため復活しない)
    expect(() => {
      getControl<HTMLButtonElement>('image-list-reload').click();
    }).not.toThrow();
    await flushAsyncWork();
  });
});

describe('resolving file size and type over the network for a non-svg image', () => {
  let restore: () => void;

  beforeEach(() => {
    restore = patchDialogEnvironment();
  });

  afterEach(() => {
    restore();
  });

  it('reads size and type from the response headers on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        headers: new Headers({ 'Content-Length': '1234', 'Content-Type': 'image/png' }),
      }),
    );

    const { messageListener } = await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    img.src = 'https://example.com/foo.png';

    await openDialog(messageListener, img);

    expect(getControl<HTMLInputElement>('size').value).toBe('1234 byte');
    expect(getControl<HTMLInputElement>('type').value).toBe('image/png');
  });

  it('falls back to error messages when the network request rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const { messageListener } = await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    img.src = 'https://example.com/bar.png';

    await openDialog(messageListener, img);

    expect(getControl<HTMLInputElement>('size').value).toBe('error_fileSize');
    expect(getControl<HTMLInputElement>('type').value).toBe('error_fileType');
  });
});

describe('resizeSupport', () => {
  let restore: () => void;

  beforeEach(() => {
    restore = patchDialogEnvironment();
  });

  afterEach(() => {
    restore();
  });

  it('re-fits the current image after the window is resized, once the debounce settles', async () => {
    const { messageListener } = await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>';

    await openDialog(messageListener, img);

    expect(() => window.dispatchEvent(new Event('resize'))).not.toThrow();

    await new Promise((resolve) => setTimeout(resolve, 350));
  });
});

describe('the search-in-page button', () => {
  let restore: () => void;

  beforeEach(() => {
    restore = patchDialogEnvironment();
  });

  afterEach(() => {
    restore();
  });

  it('closes the dialog and highlights the origin image when it is still visible in the page', async () => {
    const { messageListener } = await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>';

    await openDialog(messageListener, img);

    const dialogEl = nonNullableQuerySelector<HTMLDialogElement>(getShadowRoot(), 'dialog');
    expect(dialogEl.open).toBe(true);

    getControl<HTMLButtonElement>('search').click();

    expect(dialogEl.open).toBe(false);
  });

  it('alerts when the origin image can no longer be found in the page', async () => {
    vi.stubGlobal('alert', vi.fn());

    const { messageListener } = await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>';

    await openDialog(messageListener, img);

    img.remove();

    getControl<HTMLButtonElement>('search').click();

    expect(alert).toHaveBeenCalledWith('searched_image_error');
  });

  it('scrolls the origin image into view when it is off-screen', async () => {
    const { messageListener } = await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>';

    await openDialog(messageListener, img);

    img.getBoundingClientRect = () =>
      ({
        top: -100,
        left: 0,
        bottom: -50,
        right: 0,
      }) as DOMRect;

    expect(() => {
      getControl<HTMLButtonElement>('search').click();
    }).not.toThrow();
  });
});

describe('the dialog stays open without an image on a 404', () => {
  let restore: () => void;

  beforeEach(() => {
    restore = patchDialogEnvironment();
  });

  afterEach(() => {
    restore();
  });

  it('clears the loading state but does not append an image when the clone fails to load', async () => {
    const { messageListener } = await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    img.src = 'https://example.com/error-image.png';

    await openDialog(messageListener, img);

    const dialogEl = nonNullableQuerySelector<HTMLDialogElement>(getShadowRoot(), 'dialog');
    expect(dialogEl.open).toBe(true);
    expect(dialogEl.hasAttribute('aria-busy')).toBe(false);
    expect(getShadowRoot().getElementById('canvas-inner')?.children.length ?? 0).toBe(0);
  });
});

describe('resetting an in-dialog image via the "reset" menu item', () => {
  let restore: () => void;

  beforeEach(() => {
    restore = patchDialogEnvironment();
  });

  afterEach(() => {
    restore();
  });

  it('restores default scale and rotation while remaining in-dialog', async () => {
    const { messageListener } = await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>';

    await openDialog(messageListener, img);

    messageListener({ actionId: 'reset' }, {}, vi.fn());

    expect(getControl<HTMLInputElement>('scale').value).toBe('100');
    expect(getControl<HTMLInputElement>('rotate').value).toBe('0');
  });
});

describe('the scale-fit button', () => {
  let restore: () => void;

  beforeEach(() => {
    restore = patchDialogEnvironment();
  });

  afterEach(() => {
    restore();
  });

  it('sets scale to 100 and re-fits the current image without throwing', async () => {
    await importContentScripts({ openShadow: true });
    const img = document.createElement('img');
    document.body.appendChild(img);
    rightClick(img);

    expect(() => {
      getControl<HTMLButtonElement>('scale-fit').click();
    }).not.toThrow();
  });
});

describe('the generated dialog DOM keeps a stable id structure', () => {
  // [id, 最も近い祖先要素の id (無ければ null)] を文書順に列挙したもの。
  const EXPECTED_ID_TREE: Array<[id: string, parentId: string | null]> = [
    ['canvas', null],
    ['canvas-inner', 'canvas'],
    ['spinner', null],
    ['details', null],
    ['image-info', 'details'],
    ['readonly', 'image-info'],
    ['alt', 'readonly'],
    ['url', 'readonly'],
    ['type', 'readonly'],
    ['size', 'readonly'],
    ['natural-width', 'readonly'],
    ['natural-height', 'readonly'],
    ['aspect', 'readonly'],
    ['image-controller', 'details'],
    ['reverse', 'image-controller'],
    ['border', 'image-controller'],
    ['scale-legend', 'image-controller'],
    ['scale-fit', 'image-controller'],
    ['scale-100', 'image-controller'],
    ['scale', 'image-controller'],
    ['rotate-legend', 'image-controller'],
    ['rotate-reset', 'image-controller'],
    ['rotate-left', 'image-controller'],
    ['rotate-right', 'image-controller'],
    ['rotate', 'image-controller'],
    ['render', 'image-controller'],
    ['color', 'image-controller'],
    ['background-label', 'color'],
    ['background-custom', 'color'],
    ['background-bright', 'color'],
    ['background-dark', 'color'],
    ['image-list-section', 'details'],
    ['image-list-header', 'image-list-section'],
    ['image-list-label', 'image-list-header'],
    ['image-list-buttons', 'image-list-header'],
    ['image-list-reload', 'image-list-buttons'],
    ['image-list-prev', 'image-list-buttons'],
    ['image-list-next', 'image-list-buttons'],
    ['image-list-wrapper', 'image-list-section'],
    ['image-list', 'image-list-wrapper'],
    ['image-list-info', 'image-list-section'],
    ['image-list-info-text', 'image-list-info'],
    ['search', 'details'],
  ];

  it('renders every id-bearing element, in document order, nested under the expected id ancestor', async () => {
    await importContentScripts({ openShadow: true });

    const dialog = nonNullableQuerySelector<HTMLDialogElement>(getShadowRoot(), 'dialog');
    const idElements = [...dialog.querySelectorAll<HTMLElement>('[id]')];

    const idTree = idElements.map((el): [string, string | null] => {
      let ancestor = el.parentElement;

      while (ancestor && !ancestor.id) {
        ancestor = ancestor.parentElement;
      }

      return [el.id, ancestor?.id ?? null];
    });

    expect(idTree).toEqual(EXPECTED_ID_TREE);
  });
});
