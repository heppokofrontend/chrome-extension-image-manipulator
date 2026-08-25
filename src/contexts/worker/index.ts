const documentUrlPatterns = ['http://*/*', 'https://*/*', 'file://*/*'];

chrome.runtime.onInstalled.addListener(() => {
  const parentId = chrome.contextMenus.create({
    id: 'heppokofrontend.image.manipulator',
    title: 'Image Manipulator',
    contexts: ['all'],
    documentUrlPatterns,
  });

  [
    {
      id: 'zoom',
      title: chrome.i18n.getMessage('context_zoom'),
      children: Array.from({ length: 12 }, (_, index) => {
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
      children: Array.from({ length: 9 }, (_, index) => {
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
      documentUrlPatterns,
      parentId,
    });

    children?.forEach(({ id: childId, title: childTitle }) => {
      chrome.contextMenus.create({
        id: childId,
        title: childTitle,
        contexts: ['all'],
        documentUrlPatterns,
        parentId: id,
      });
    });
  });
});

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
