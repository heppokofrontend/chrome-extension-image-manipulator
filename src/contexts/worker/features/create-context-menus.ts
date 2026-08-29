import { getMessage } from '@/utils';

interface MenuItem {
  id: string;
  title: string;
  children?: MenuItem[];
}

export const createMenuDefinitions = (): MenuItem[] => [
  {
    id: 'zoom',
    title: getMessage('context_zoom'),
    children: Array.from({ length: 12 }, (_, index) => {
      const value = `${(index + 1) * 0.25 * 100}%`;

      return { id: value, title: value };
    }),
  },
  {
    id: 'rotate',
    title: getMessage('context_rotate'),
    children: Array.from({ length: 9 }, (_, index) => {
      const value = `${index * 45}deg`;

      return { id: value, title: value };
    }),
  },
  {
    id: 'reverse',
    title: getMessage('context_reverse'),
  },
  {
    id: 'dialog',
    title: getMessage('context_dialog'),
  },
  {
    id: 'reset-menus',
    title: getMessage('context_resetMenus'),
    children: [
      { id: 'reset', title: getMessage('context_reset') },
      { id: 'reset-all', title: getMessage('context_resetAll') },
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
