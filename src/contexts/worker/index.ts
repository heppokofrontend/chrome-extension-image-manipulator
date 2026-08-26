import { registerContextMenusListener } from '@/contexts/worker/features/create-context-menus';

registerContextMenusListener();

chrome.contextMenus.onClicked.addListener(({ menuItemId }: chrome.contextMenus.OnClickData) => {
  const handle = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { menuItemId }).catch(console.log);
    }

    return true;
  };

  void handle();
});
