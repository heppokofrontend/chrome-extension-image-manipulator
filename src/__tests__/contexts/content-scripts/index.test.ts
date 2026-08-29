import { afterEach, describe, expect, it, vi } from 'vitest';

type MessageListener = (
  message: { menuItemId: string },
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

const nonNullableQuerySelector = <T extends Element>(root: ParentNode, selector: string) =>
  root.querySelector<T>(selector)!;

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('the generated dialog DOM keeps a stable id structure', () => {
  // [id, 最も近い祖先要素の id (無ければ null)] を文書順に列挙したもの。
  // rotate-left/rotate-right は同じ ROTATE_ICON アセットを埋め込むため、
  // svg#_x32_ が意図的に重複する。
  const EXPECTED_ID_TREE: Array<[id: string, parentId: string | null]> = [
    ['canvas', null],
    ['canvas-inner', 'canvas'],
    ['spinner', null],
    ['details', null],
    ['details-main', 'details'],
    ['readonly', 'details-main'],
    ['alt', 'readonly'],
    ['url', 'readonly'],
    ['type', 'readonly'],
    ['size', 'readonly'],
    ['natural-width', 'readonly'],
    ['natural-height', 'readonly'],
    ['aspect', 'readonly'],
    ['editable', 'details'],
    ['reverse', 'editable'],
    ['border', 'editable'],
    ['scale-legend', 'editable'],
    ['scale-fit', 'editable'],
    ['scale-100', 'editable'],
    ['scale', 'editable'],
    ['rotate-legend', 'editable'],
    ['rotate-reset', 'editable'],
    ['rotate-left', 'editable'],
    ['_x32_', 'rotate-left'],
    ['rotate-right', 'editable'],
    ['_x32_', 'rotate-right'],
    ['rotate', 'editable'],
    ['render', 'editable'],
    ['color', 'editable'],
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
