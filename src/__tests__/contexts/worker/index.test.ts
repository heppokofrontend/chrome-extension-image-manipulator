import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type OnClickData = chrome.contextMenus.OnClickData;

let onClickedListener: (info: OnClickData) => void;
let queryTabs: ReturnType<typeof vi.fn>;
let sendMessage: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();

  queryTabs = vi.fn().mockResolvedValue([]);
  sendMessage = vi.fn().mockResolvedValue(undefined);

  vi.stubGlobal('chrome', {
    contextMenus: {
      onClicked: {
        addListener: (listener: typeof onClickedListener) => {
          onClickedListener = listener;
        },
      },
    },
    runtime: {
      onInstalled: {
        addListener: () => {},
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

describe('onClicked', () => {
  it('forwards the menu click to the active tab, including file:// pages', async () => {
    queryTabs.mockResolvedValue([{ id: 42, url: 'file:///path/to/image.jpg' }]);

    onClickedListener({ menuItemId: '150%' } as OnClickData);
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalled());

    expect(sendMessage).toHaveBeenCalledWith(42, { menuItemId: '150%' });
  });

  it('does not forward the click when the active tab has no id', async () => {
    queryTabs.mockResolvedValue([{ url: 'https://example.com' }]);

    onClickedListener({ menuItemId: '150%' } as OnClickData);
    await vi.waitFor(() => expect(queryTabs).toHaveBeenCalled());

    expect(sendMessage).not.toHaveBeenCalled();
  });
});
