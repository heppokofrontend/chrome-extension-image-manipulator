import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type CreateProperties = chrome.contextMenus.CreateProperties;
type OnClickData = chrome.contextMenus.OnClickData;

let onInstalledListener: () => void;
let onClickedListener: (info: OnClickData) => void;
let createContextMenu: ReturnType<typeof vi.fn<(properties: CreateProperties) => string | number>>;
let queryTabs: ReturnType<typeof vi.fn>;
let sendMessage: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();

  createContextMenu = vi.fn().mockReturnValue('parent-id');
  queryTabs = vi.fn().mockResolvedValue([]);
  sendMessage = vi.fn().mockResolvedValue(undefined);

  vi.stubGlobal('chrome', {
    contextMenus: {
      create: createContextMenu,
      onClicked: {
        addListener: (listener: typeof onClickedListener) => {
          onClickedListener = listener;
        },
      },
    },
    i18n: {
      getMessage: (key: string) => key,
    },
    runtime: {
      onInstalled: {
        addListener: (listener: typeof onInstalledListener) => {
          onInstalledListener = listener;
        },
      },
    },
    tabs: {
      query: queryTabs,
      sendMessage,
    },
  });

  await import('@/contexts/worker/index');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('onInstalled', () => {
  it('creates the zoom submenu from 25% to 300% in 25% steps', () => {
    onInstalledListener();

    const zoomChildIds = createContextMenu.mock.calls
      .filter(([properties]) => properties.parentId === 'zoom')
      .map(([properties]) => properties.id);

    expect(zoomChildIds).toEqual([
      '25%',
      '50%',
      '75%',
      '100%',
      '125%',
      '150%',
      '175%',
      '200%',
      '225%',
      '250%',
      '275%',
      '300%',
    ]);
  });

  it('creates the rotate submenu from 0deg to 360deg in 45deg steps', () => {
    onInstalledListener();

    const rotateChildIds = createContextMenu.mock.calls
      .filter(([properties]) => properties.parentId === 'rotate')
      .map(([properties]) => properties.id);

    expect(rotateChildIds).toEqual([
      '0deg',
      '45deg',
      '90deg',
      '135deg',
      '180deg',
      '225deg',
      '270deg',
      '315deg',
      '360deg',
    ]);
  });
});

describe('onClicked', () => {
  it('forwards the menu click to the active http(s) tab', async () => {
    queryTabs.mockResolvedValue([{ id: 42, url: 'https://example.com' }]);

    onClickedListener({ menuItemId: '150%' } as OnClickData);
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalled());

    expect(sendMessage).toHaveBeenCalledWith(42, { menuItemId: '150%' });
  });

  it('does not forward the click when the tab is not http(s)', async () => {
    queryTabs.mockResolvedValue([{ id: 7, url: 'chrome://extensions' }]);

    onClickedListener({ menuItemId: '150%' } as OnClickData);
    await vi.waitFor(() => expect(queryTabs).toHaveBeenCalled());

    expect(sendMessage).not.toHaveBeenCalled();
  });
});
