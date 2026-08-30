import type { ImageListEntry } from '@/contexts/content-scripts/components/image-list/types';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';

import { buildListItems } from './build-list-items';

export const renderImageList = (images: ImageListEntry[]) => {
  const { imageList } = CONTENT_UI;
  const fragment = document.createDocumentFragment();
  const listItems = buildListItems(images);

  fragment.append(...listItems);
  imageList.textContent = '';
  imageList.append(fragment);
};
