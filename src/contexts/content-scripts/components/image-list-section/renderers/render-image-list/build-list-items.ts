import {
  imageListItemSourceMap,
  onImageListItemClick,
  onImageListKeydown,
} from '@/contexts/content-scripts/components/image-list-section/handlers';
import type { ImageListEntry } from '@/contexts/content-scripts/components/image-list-section/types';
import { STATE } from '@/contexts/content-scripts/state';
import { getMessage } from '@/utils';

export const buildListItems = (images: ImageListEntry[]): HTMLLIElement[] =>
  images.flatMap((entry) => {
    const { src, alt, isError, originalElement } = entry;

    if (isError) {
      return [];
    }

    const listItem = document.createElement('li');
    const button = document.createElement('button');

    button.tabIndex = -1;
    imageListItemSourceMap.set(button, originalElement);
    button.addEventListener('click', onImageListItemClick);
    button.addEventListener('keydown', onImageListKeydown);

    listItem.className = 'image-list-item';
    button.className = 'image-list-item-button';

    if (STATE.currentImageElement?.src === src) {
      button.setAttribute('aria-current', 'true');
      button.tabIndex = 0;
    }

    const img = document.createElement('img');

    img.src = src;
    img.onerror = () => {
      listItem.remove();
      entry.isError = true;
    };

    // alt がない時、image_list_no_alt を alt に指定するとここの alt が拾われてしまうため、aria-label を使用する
    if (alt) {
      img.alt = alt;
    } else {
      img.setAttribute('aria-label', getMessage('image_list_no_alt'));
    }

    button.append(img);
    listItem.append(button);

    return listItem;
  });
