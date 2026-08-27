export const buildDialogElement = () => {
  const element = document.createElement('dialog');

  element.role = 'dialog';
  element.ariaModal = 'true';
  element.ariaLabel = chrome.i18n.getMessage('extName');
  element.addEventListener('keydown', (e) => {
    if (e.key === 'ESC') {
      e.preventDefault();
      e.stopPropagation();
      element.close();
    }
  });

  return element;
};
