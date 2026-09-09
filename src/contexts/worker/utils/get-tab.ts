export type TabWithId = chrome.tabs.Tab & { id: number };

export const getTab = async (): Promise<TabWithId | null> => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (tab?.id === undefined) return null;

  return { ...tab, id: tab.id };
};
