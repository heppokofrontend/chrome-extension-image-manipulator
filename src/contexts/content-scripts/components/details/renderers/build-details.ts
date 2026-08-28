export const buildDetails = () => {
  const element = document.createElement('div');
  const closeBtnForPortrait = document.createElement('button');

  closeBtnForPortrait.type = 'button';
  closeBtnForPortrait.className = 'close-btn for-portrait';
  closeBtnForPortrait.textContent = chrome.i18n.getMessage('button_close');

  element.id = 'details';
  element.insertAdjacentHTML(
    'afterbegin',
    `
      <p class="close">
        <button type="button" class="close-btn">${chrome.i18n.getMessage('button_close')}</button>
      </p>
    `,
  );

  return {
    element,
    closeBtnForPortrait,
    closeBtn: element.querySelector<HTMLButtonElement>('button')!,
  };
};
