import { SPINNER_SVG } from '@/contexts/content-scripts/assets';
import { nonNullableQuerySelector } from '@/contexts/content-scripts/utils/non-nullable-query-selector';

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

  element.insertAdjacentHTML(
    'afterbegin',
    `
    <div id="canvas">
      <div id="canvas-inner"></div>
    </div>
    <div id="spinner">${SPINNER_SVG}</div>
    <button type="button" class="close-btn for-portrait">${chrome.i18n.getMessage('button_close')}</button>
    <div id="details">
      <p class="close">
        <button type="button" class="close-btn">${chrome.i18n.getMessage('button_close')}</button>
      </p>
      <div id="image-info"></div>
      <div id="image-controller"></div>
      <div id="image-list-section" role="group" aria-labelledby="image-list-label"></div>
      <div class="group">
        <p class="search-wrapper">
          <button id="search">
            🔍 ${chrome.i18n.getMessage('search_in_page')}
          </button>
        </p>
      </div>
    </div>
  `,
  );

  return element;
};

const dialog = buildDialogElement();

export const CONTENT_UI = {
  imageViewer: document.createElement('heppokofrontend-imagemanipulator'),
  dialog,
  canvas: nonNullableQuerySelector('#canvas', dialog),
  spaceElement: nonNullableQuerySelector('#canvas-inner', dialog),
  imageInfo: nonNullableQuerySelector('#image-info', dialog),
  imageController: nonNullableQuerySelector('#image-controller', dialog),
  imageListSection: nonNullableQuerySelector('#image-list-section', dialog),
  closeBtn: nonNullableQuerySelector<HTMLButtonElement>('#details .close .close-btn', dialog),
  closeBtnForPortrait: nonNullableQuerySelector<HTMLButtonElement>(
    '.close-btn.for-portrait',
    dialog,
  ),
  searchButton: nonNullableQuerySelector<HTMLButtonElement>('#search', dialog),
};
