import { onDetailsClose, onSearchClick } from '@/contexts/content-scripts/handlers';

export const buildDetails = () => {
  const element = document.createElement('div');
  const closeBtnForPortrait = document.createElement('button');

  closeBtnForPortrait.type = 'button';
  closeBtnForPortrait.className = 'close-btn for-portrait';
  closeBtnForPortrait.textContent = chrome.i18n.getMessage('button_close');
  closeBtnForPortrait.addEventListener('click', onDetailsClose);

  element.id = 'details';
  element.insertAdjacentHTML(
    'afterbegin',
    `
      <p class="close">
        <button type="button" class="close-btn">${chrome.i18n.getMessage('button_close')}</button>
      </p>
    `,
  );
  element.insertAdjacentHTML(
    'beforeend',
    `
      <div class="group">
        <p class="search-wrapper">
          <button id="search">
            🔍 ${chrome.i18n.getMessage('search_in_page')}
          </button>
        </p>
      </div>
    `,
  );

  const closeBtn = element.querySelector<HTMLButtonElement>('.close .close-btn')!;
  const searchButton = element.querySelector<HTMLButtonElement>('#search')!;

  closeBtn.addEventListener('click', onDetailsClose);
  searchButton.addEventListener('click', onSearchClick);

  return { element, closeBtnForPortrait };
};
