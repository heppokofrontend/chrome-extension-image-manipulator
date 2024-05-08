chrome.runtime.onInstalled.addListener(() => {
  const parentId = chrome.contextMenus.create({
    id: 'heppokofrontend.image.manipulator',
    title: 'Image Manipulator',
    contexts: ['all'],
  });

  [
    {
      id: 'zoom',
      title: chrome.i18n.getMessage('context_zoom'),
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
      title: chrome.i18n.getMessage('context_rotate'),
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
      title: chrome.i18n.getMessage('context_reverse'),
    },
    {
      id: 'dialog',
      title: chrome.i18n.getMessage('context_dialog'),
    },
    {
      id: 'reset-menus',
      title: chrome.i18n.getMessage('context_resetMenus'),
      children: [
        {
          id: 'reset',
          title: chrome.i18n.getMessage('context_reset'),
        },
        {
          id: 'reset-all',
          title: chrome.i18n.getMessage('context_resetAll'),
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

chrome.contextMenus.onClicked.addListener(
  async ({ menuItemId }: chrome.contextMenus.OnClickData) => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab?.id && tab.url) {
      if (tab.url.startsWith('http')) {
        chrome.tabs.sendMessage(tab.id, { menuItemId }).catch(console.log);
      }
    }

    return true;
  },
);
