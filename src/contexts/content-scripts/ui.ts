import { SPINNER_SVG } from '@/contexts/content-scripts/assets';
import { nonNullableQuerySelector } from '@/contexts/content-scripts/utils/non-nullable-query-selector';
import { getMessage } from '@/utils';

export const buildDialogElement = () => {
  const element = document.createElement('dialog');

  element.role = 'dialog';
  element.ariaModal = 'true';
  element.ariaLabel = getMessage('extName');
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
    <button type="button" class="close-btn for-portrait">${getMessage('button_close')}</button>
    <div id="details">
      <p class="close">
        <button type="button" class="close-btn">${getMessage('button_close')}</button>
      </p>
      <div id="image-info"></div>
      <div id="image-controller"></div>
      <div id="image-list-section" role="group" aria-labelledby="image-list-label">
        <div id="image-list-header">
          <p id="image-list-label" class="legend">${getMessage('image_list_title')}</p>

          <div id="image-list-buttons">
            <p><button type="button" id="image-list-reload">${getMessage(
              'image_list_reload',
            )}</button></p>
            <p><button type="button" id="image-list-prev">${getMessage(
              'image_list_prev',
            )}</button></p>
            <p><button type="button" id="image-list-next">${getMessage(
              'image_list_next',
            )}</button></p>
          </div>
        </div>

        <div id="image-list-wrapper" title="${getMessage('image_list_description')}">
          <ul id="image-list"></ul>
        </div>

        <p id="image-list-info">
          ${getMessage('image_list_info')}
          <span id="image-list-info-text" aria-live="polite"></span>
        </p>
      </div>
      <div class="group">
        <p class="search-wrapper">
          <button id="search">
            🔍 ${getMessage('search_in_page')}
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
  imageListReload: nonNullableQuerySelector<HTMLButtonElement>('#image-list-reload', dialog),
  imageListPrev: nonNullableQuerySelector<HTMLButtonElement>('#image-list-prev', dialog),
  imageListNext: nonNullableQuerySelector<HTMLButtonElement>('#image-list-next', dialog),
  imageList: nonNullableQuerySelector<HTMLElement>('#image-list', dialog),
  imageListInfo: nonNullableQuerySelector<HTMLElement>('#image-list-info-text', dialog),
  closeBtn: nonNullableQuerySelector<HTMLButtonElement>('#details .close .close-btn', dialog),
  closeBtnForPortrait: nonNullableQuerySelector<HTMLButtonElement>(
    '.close-btn.for-portrait',
    dialog,
  ),
  searchButton: nonNullableQuerySelector<HTMLButtonElement>('#search', dialog),
};
