import { afterEach, describe, expect, it, vi } from 'vitest';

import { getTab } from '@/contexts/worker/utils/get-tab';

const stubQuery = (queryResult: chrome.tabs.Tab[]) => {
  const query = vi.fn().mockResolvedValue(queryResult);

  vi.stubGlobal('chrome', { tabs: { query } });

  return query;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getTab', () => {
  it('resolves the active tab in the current window', async () => {
    const query = stubQuery([{ id: 42, url: 'https://example.com' } as chrome.tabs.Tab]);

    const tab = await getTab();

    expect(query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(tab).toEqual({ id: 42, url: 'https://example.com' });
  });

  it('resolves null when there is no active tab', async () => {
    stubQuery([]);

    expect(await getTab()).toBeNull();
  });

  it('resolves null when the active tab has no id', async () => {
    stubQuery([{ url: 'https://example.com' } as chrome.tabs.Tab]);

    expect(await getTab()).toBeNull();
  });
});
