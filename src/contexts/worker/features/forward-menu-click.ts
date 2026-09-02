import { getTab } from '@/contexts/worker/utils';

const VALUELESS_ACTION_ID_LIST = ['reset-all', 'reset', 'reverse', 'dialog'] as const;
type ValuelessActionId = (typeof VALUELESS_ACTION_ID_LIST)[number];

const isValuelessActionId = (value: string): value is ValuelessActionId =>
  (VALUELESS_ACTION_ID_LIST as ReadonlyArray<string>).includes(value);

const resolveContentScriptMessage = (menuItemId: unknown): ContextMenuMessage | null => {
  if (typeof menuItemId !== 'string') {
    return null;
  }

  if (menuItemId.endsWith('%')) {
    return {
      menuItemId: 'scale',
      value: parseInt(menuItemId, 10),
    };
  }

  if (menuItemId.endsWith('deg')) {
    return {
      menuItemId: 'rotate',
      value: parseInt(menuItemId, 10),
    };
  }

  if (isValuelessActionId(menuItemId)) {
    return { menuItemId };
  }

  return null;
};

const forwardMenuClick = async ({ menuItemId }: chrome.contextMenus.OnClickData) => {
  const tab = await getTab();

  if (tab) {
    const contentMessage = resolveContentScriptMessage(menuItemId);

    if (contentMessage) {
      chrome.tabs.sendMessage(tab.id, contentMessage).catch(console.log);
    }
  }
};

export const registerContextMenuClickListener = () => {
  chrome.contextMenus.onClicked.addListener((info) => {
    void forwardMenuClick(info);
  });
};
