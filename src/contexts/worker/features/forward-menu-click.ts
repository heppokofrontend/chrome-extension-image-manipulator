import { getTab, parseRotateMenuId, parseScaleMenuId } from '@/contexts/worker/utils';

export const VALUELESS_ACTION_ID_LIST = ['reset-all', 'reset', 'reverse', 'dialog'] as const;
type ValuelessActionId = (typeof VALUELESS_ACTION_ID_LIST)[number];

const isValuelessActionId = (value: string): value is ValuelessActionId =>
  (VALUELESS_ACTION_ID_LIST as ReadonlyArray<string>).includes(value);

const resolveContentScriptMessage = (menuItemId: unknown): ContextMenuMessage | null => {
  if (typeof menuItemId !== 'string') {
    return null;
  }

  const scaleValue = parseScaleMenuId(menuItemId);

  if (scaleValue !== null) {
    return { actionId: 'scale', value: scaleValue };
  }

  const rotateValue = parseRotateMenuId(menuItemId);

  if (rotateValue !== null) {
    return { actionId: 'rotate', value: rotateValue };
  }

  if (isValuelessActionId(menuItemId)) {
    return { actionId: menuItemId };
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
