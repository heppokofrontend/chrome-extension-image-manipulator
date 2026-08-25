const forwardMenuClick = async ({ menuItemId }: chrome.contextMenus.OnClickData) => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { menuItemId }).catch(console.log);
  }
};

export const registerContextMenuClickListener = () => {
  chrome.contextMenus.onClicked.addListener((info) => {
    void forwardMenuClick(info);
  });
};
