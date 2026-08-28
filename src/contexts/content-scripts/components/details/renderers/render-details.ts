import { renderImageController } from '@/contexts/content-scripts/components/image-controller';
import { renderImageInfo } from '@/contexts/content-scripts/components/image-info';
import {
  getImageListSectionFields,
  renderImageListSection,
} from '@/contexts/content-scripts/components/image-list-section';
import { addEventImageListControllers } from '../effects';
import { onDetailsClose, onSearchClick } from '../handlers';
import { buildDetails } from './build-details';

export const renderDetails = () => {
  const { element, closeBtnForPortrait, closeBtn } = buildDetails();

  closeBtnForPortrait.addEventListener('click', onDetailsClose);

  renderImageInfo(element);
  renderImageController(element);
  renderImageListSection(element);

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

  closeBtn.addEventListener('click', onDetailsClose);

  const imageListSectionFields = getImageListSectionFields();
  const searchButton = element.querySelector<HTMLButtonElement>('#search')!;

  addEventImageListControllers(imageListSectionFields);

  searchButton.addEventListener('click', onSearchClick);

  const ui = document.createDocumentFragment();

  ui.append(closeBtnForPortrait);
  ui.append(element);

  return ui;
};
