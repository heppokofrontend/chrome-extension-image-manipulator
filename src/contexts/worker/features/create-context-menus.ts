interface MenuItem {
  id: string;
  title: string;
  children?: MenuItem[];
}

export const createMenuDefinitions = (): MenuItem[] => [
  {
    id: 'zoom',
    title: chrome.i18n.getMessage('context_zoom'),
    children: Array.from({ length: 12 }, (_, index) => {
      const value = `${(index + 1) * 0.25 * 100}%`;

      return { id: value, title: value };
    }),
  },
  {
    id: 'rotate',
    title: chrome.i18n.getMessage('context_rotate'),
    children: Array.from({ length: 9 }, (_, index) => {
      const value = `${index * 45}deg`;

      return { id: value, title: value };
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
      { id: 'reset', title: chrome.i18n.getMessage('context_reset') },
      { id: 'reset-all', title: chrome.i18n.getMessage('context_resetAll') },
    ],
  },
];

const documentUrlPatterns = ['http://*/*', 'https://*/*', 'file://*/*'];

const createContextMenus = () => {
  const parentId = chrome.contextMenus.create({
    id: 'heppokofrontend.image.manipulator',
    title: 'Image Manipulator',
    contexts: ['all'],
    documentUrlPatterns,
  });

  createMenuDefinitions().forEach(({ id, title, children }) => {
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
};

export const registerContextMenusListener = () => {
  chrome.runtime.onInstalled.addListener(createContextMenus);
};
