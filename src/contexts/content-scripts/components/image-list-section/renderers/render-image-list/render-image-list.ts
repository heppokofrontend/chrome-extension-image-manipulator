import type { ImageListEntry } from '@/contexts/content-scripts/components/image-list-section/types';

import { buildListItems } from './build-list-items';

export const renderImageList = (imageList: HTMLElement, images: ImageListEntry[]) => {
  const fragment = document.createDocumentFragment();
  const listItems = buildListItems(images);

  fragment.append(...listItems);
  imageList.textContent = '';
  imageList.append(fragment);
};
