import { afterEach, describe, expect, it, vi } from 'vitest';

import { registerContextMenuClickListener } from '@/contexts/worker/features/forward-menu-click';

type OnClickData = chrome.contextMenus.OnClickData;

const setup = (queryResult: chrome.tabs.Tab[]) => {
  let onClickedListener: ((info: OnClickData) => void) | undefined;
  const queryTabs = vi.fn().mockResolvedValue(queryResult);
  const sendMessage = vi.fn().mockResolvedValue(undefined);

  vi.stubGlobal('chrome', {
    contextMenus: {
      onClicked: {
        addListener: (listener: (info: OnClickData) => void) => {
          onClickedListener = listener;
        },
      },
    },
    tabs: {
      query: queryTabs,
      sendMessage,
    },
  });

  registerContextMenuClickListener();

  return {
    trigger: (info: OnClickData) => onClickedListener?.(info),
    queryTabs,
    sendMessage,
  };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('registerContextMenuClickListener', () => {
  it('forwards the menu click to the active http(s) tab', async () => {
    const { trigger, sendMessage } = setup([
      { id: 42, url: 'https://example.com' } as chrome.tabs.Tab,
    ]);

    trigger({ menuItemId: '150%' } as OnClickData);
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalled());

    expect(sendMessage).toHaveBeenCalledWith(42, { menuItemId: '150%' });
  });

  it('forwards the menu click to the active tab, including file:// pages', async () => {
    const { trigger, sendMessage } = setup([
      { id: 42, url: 'file:///path/to/image.jpg' } as chrome.tabs.Tab,
    ]);

    trigger({ menuItemId: '150%' } as OnClickData);
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalled());

    expect(sendMessage).toHaveBeenCalledWith(42, { menuItemId: '150%' });
  });

  it('does not forward when the active tab has no id', async () => {
    const { trigger, queryTabs, sendMessage } = setup([
      { url: 'https://example.com' } as chrome.tabs.Tab,
    ]);

    trigger({ menuItemId: '150%' } as OnClickData);
    await vi.waitFor(() => expect(queryTabs).toHaveBeenCalled());

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('does not forward when there is no active tab', async () => {
    const { trigger, queryTabs, sendMessage } = setup([]);

    trigger({ menuItemId: '150%' } as OnClickData);
    await vi.waitFor(() => expect(queryTabs).toHaveBeenCalled());

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('does not throw when sendMessage rejects', async () => {
    let onClickedListener: ((info: OnClickData) => void) | undefined;
    const queryTabs = vi
      .fn()
      .mockResolvedValue([{ id: 42, url: 'https://example.com' } as chrome.tabs.Tab]);
    const sendMessage = vi.fn().mockReturnValue(Promise.reject(new Error('network error')));
    const log = vi.fn();

    vi.stubGlobal('chrome', {
      contextMenus: {
        onClicked: {
          addListener: (listener: (info: OnClickData) => void) => {
            onClickedListener = listener;
          },
        },
      },
      tabs: { query: queryTabs, sendMessage },
    });
    vi.stubGlobal('console', { ...console, log });

    registerContextMenuClickListener();
    onClickedListener?.({ menuItemId: '150%' } as OnClickData);

    await vi.waitFor(() => expect(log).toHaveBeenCalledWith(new Error('network error')));
  });
});
