const state = {
  tabId: NaN,
};

const onClickContextMenus = async ({ menuItemId }: chrome.contextMenus.OnClickData) => {
  const tab = await chrome.tabs.get(state.tabId);

  if (tab?.url?.startsWith('http')) {
    chrome.tabs.sendMessage(state.tabId, { menuItemId }).catch(console.log);

    return true;
  }

  return false;
};

const setTabId = (tabId: number) => {
  state.tabId = tabId;
  chrome.contextMenus.onClicked.removeListener(onClickContextMenus);
  chrome.contextMenus.onClicked.addListener(onClickContextMenus);

  return true;
};
chrome.tabs.onUpdated.addListener(setTabId);
chrome.tabs.onActivated.addListener(({ tabId }) => setTabId(tabId));
chrome.runtime.onInstalled.addListener(() => {
  const parentId = chrome.contextMenus.create({
    id: 'heppokofrontend.image.controler',
    title: 'Image Controler',
    contexts: ['all'],
  });

  [
    {
      id: 'zoom',
      title: '拡大',
      children: [...new Array(12)].map((_, index) => {
        const value = `${(index + 1) * 0.25 * 100}%`;

        return {
          id: value,
          title: value,
        };
      }),
    },
    {
      id: 'rotate',
      title: '回転',
      children: [...new Array(9)].map((_, index) => {
        const value = `${index * 45}deg`;

        return {
          id: value,
          title: value,
        };
      }),
    },
    {
      id: 'reverse',
      title: '左右反転',
    },
    {
      id: 'dialog',
      title: '詳細を表示',
    },
    {
      id: 'reset-menus',
      title: 'リセット',
      children: [
        {
          id: 'reset',
          title: 'この画像を元に戻す',
        },
        {
          id: 'reset-all',
          title: 'すべての画像を元に戻す',
        },
      ],
    },
  ].forEach(({ id, title, children }) => {
    chrome.contextMenus.create({
      id,
      title,
      contexts: ['all'],
      parentId,
    });

    children?.forEach(({ id: childId, title: childTitle }) => {
      chrome.contextMenus.create({
        id: childId,
        title: childTitle,
        contexts: ['all'],
        parentId: id,
      });
    });
  });
});
