import { nonNullableQuerySelector } from '@/contexts/content-scripts/utils';

export const buildImageListSection = () => {
  const element = document.createElement('div');

  element.id = 'image-list-section';
  element.setAttribute('role', 'group');
  element.setAttribute('aria-labelledby', 'image-list-label');
  element.innerHTML = `
    <div id="image-list-header">
      <p id="image-list-label" class="legend">${chrome.i18n.getMessage('image_list_title')}</p>

      <div id="image-list-buttons">
        <p><button type="button" id="image-list-reload">${chrome.i18n.getMessage(
          'image_list_reload',
        )}</button></p>
        <p><button type="button" id="image-list-prev">${chrome.i18n.getMessage(
          'image_list_prev',
        )}</button></p>
        <p><button type="button" id="image-list-next">${chrome.i18n.getMessage(
          'image_list_next',
        )}</button></p>
      </div>
    </div>

    <div id="image-list-wrapper" title="${chrome.i18n.getMessage('image_list_description')}">
      <ul id="image-list"></ul>
    </div>

    <p id="image-list-info">
      ${chrome.i18n.getMessage('image_list_info')}
      <span id="image-list-info-text" aria-live="polite"></span>
    </p>
  `;

  return {
    element,
    reload: nonNullableQuerySelector<HTMLButtonElement>('#image-list-reload', element),
    prev: nonNullableQuerySelector<HTMLButtonElement>('#image-list-prev', element),
    next: nonNullableQuerySelector<HTMLButtonElement>('#image-list-next', element),
    imageList: nonNullableQuerySelector<HTMLElement>('#image-list', element),
    imageListInfo: nonNullableQuerySelector<HTMLElement>('#image-list-info-text', element),
  };
};
