import { getTab } from '@/contexts/worker/utils';

const forwardMenuClick = async ({ menuItemId }: chrome.contextMenus.OnClickData) => {
  const tab = await getTab();

  if (tab) {
    chrome.tabs.sendMessage(tab.id, { menuItemId }).catch(console.log);
  }
};

export const registerContextMenuClickListener = () => {
  chrome.contextMenus.onClicked.addListener((info) => {
    void forwardMenuClick(info);
  });
};
