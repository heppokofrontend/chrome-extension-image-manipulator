import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createMenuDefinitions,
  registerContextMenusListener,
} from '@/contexts/worker/features/create-context-menus';

type CreateProperties = chrome.contextMenus.CreateProperties;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createMenuDefinitions', () => {
  it('builds the zoom submenu from 25% to 300% in 25% steps', () => {
    vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

    const zoom = createMenuDefinitions().find(({ id }) => id === 'zoom');

    expect(zoom?.children?.map(({ id }) => id)).toEqual([
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

  it('builds the rotate submenu from 0deg to 360deg in 45deg steps', () => {
    vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

    const rotate = createMenuDefinitions().find(({ id }) => id === 'rotate');

    expect(rotate?.children?.map(({ id }) => id)).toEqual([
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

  it('builds the reverse, dialog and reset-menus entries', () => {
    vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => key } });

    const definitions = createMenuDefinitions();

    expect(definitions.find(({ id }) => id === 'reverse')).toEqual({
      id: 'reverse',
      title: 'context_reverse',
    });
    expect(definitions.find(({ id }) => id === 'dialog')).toEqual({
      id: 'dialog',
      title: 'context_dialog',
    });
    expect(definitions.find(({ id }) => id === 'reset-menus')?.children).toEqual([
      { id: 'reset', title: 'context_reset' },
      { id: 'reset-all', title: 'context_resetAll' },
    ]);
  });
});

describe('registerContextMenusListener', () => {
  it('creates every top-level menu under the extension root and every child under its parent', () => {
    let onInstalledListener: (() => void) | undefined;
    const create = vi
      .fn<(properties: CreateProperties) => string | number>()
      .mockReturnValue('root-id');

    vi.stubGlobal('chrome', {
      contextMenus: { create },
      i18n: { getMessage: (key: string) => key },
      runtime: {
        onInstalled: {
          addListener: (listener: () => void) => {
            onInstalledListener = listener;
          },
        },
      },
    });

    registerContextMenusListener();
    onInstalledListener?.();

    const topLevelIds = create.mock.calls
      .filter(([properties]) => properties.parentId === 'root-id')
      .map(([properties]) => properties.id);

    expect(topLevelIds).toEqual(['zoom', 'rotate', 'reverse', 'dialog', 'reset-menus']);

    const resetChildIds = create.mock.calls
      .filter(([properties]) => properties.parentId === 'reset-menus')
      .map(([properties]) => properties.id);

    expect(resetChildIds).toEqual(['reset', 'reset-all']);
  });

  it('restricts every menu item to http(s) and file pages', () => {
    let onInstalledListener: (() => void) | undefined;
    const create = vi
      .fn<(properties: CreateProperties) => string | number>()
      .mockReturnValue('root-id');

    vi.stubGlobal('chrome', {
      contextMenus: { create },
      i18n: { getMessage: (key: string) => key },
      runtime: {
        onInstalled: {
          addListener: (listener: () => void) => {
            onInstalledListener = listener;
          },
        },
      },
    });

    registerContextMenusListener();
    onInstalledListener?.();

    const patterns = create.mock.calls.map(([properties]) => properties.documentUrlPatterns);

    expect(
      patterns.every(
        (pattern) =>
          pattern?.includes('http://*/*') &&
          pattern.includes('https://*/*') &&
          pattern.includes('file://*/*'),
      ),
    ).toBe(true);
  });
});
