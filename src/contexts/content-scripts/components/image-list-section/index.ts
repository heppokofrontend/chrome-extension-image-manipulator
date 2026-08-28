import { showDialog } from '@/contexts/content-scripts/show-dialog';
import { IMAGE_LIST_COLS, IMAGE_LIST_GAP, SELECTOR } from '@/contexts/content-scripts/constants';
import { STATE } from '@/contexts/content-scripts/state';
import {
  convertDummyElementToImg,
  convertedDummyMap,
  convertedSvgMap,
  convertSVGToImg,
  getFileSize,
  setImageData,
} from '@/contexts/content-scripts/utils';

import { getImageListSectionFields } from './renderers';

export { getImageListSectionFields, renderImageListSection } from './renderers';

// 404の画像があったり、bodyスクロール時に画像が追加されたりすると、画像を切り替えるたびにリストを再生成してチカチカしたりするのでキャッシュしておく
let imagesCache: {
  src: string;
  alt: string;
  isError: boolean;
  originalElement: SVGElement | HTMLElement;
}[] = [];

export const createImageList = (noRecreate: boolean = false) => {
  const { imageList, imageListInfo } = getImageListSectionFields();
  const fragment = document.createDocumentFragment();
  const images = noRecreate
    ? imagesCache
    : [...document.querySelectorAll<HTMLImageElement | SVGElement | HTMLElement>(SELECTOR)]
        .map((originalElement) => {
          if (originalElement instanceof HTMLImageElement) {
            const result = {
              src: originalElement.src,
              alt: originalElement.alt.trim(),
              isError: false,
              originalElement,
            };

            // support lazyload by script
            const handleLoad = async () => {
              const clonedImage = document.createElement('img');
              result.src = originalElement.src;
              result.alt = originalElement.alt;
              clonedImage.src = originalElement.src;
              clonedImage.alt = originalElement.alt;

              setImageData(
                originalElement,
                {
                  clonedImage,
                },
                true,
              );
              await getFileSize(clonedImage);
              setImageData(
                clonedImage,
                {
                  isInDialog: true,
                  origin: originalElement,
                },
                true,
              );
            };

            originalElement.addEventListener('load', () => {
              void handleLoad();
            });
            originalElement.addEventListener('error', () => {
              result.isError = true;
            });

            return result;
          }

          const isSVG = originalElement instanceof SVGElement;
          const pseudoImage = isSVG
            ? convertedSvgMap.get(originalElement)
            : convertedDummyMap.get(originalElement);

          if (pseudoImage) {
            return {
              src: pseudoImage.src,
              alt: pseudoImage.alt,
              isError: false,
              originalElement,
            };
          }

          const newPseudoImage = isSVG
            ? convertSVGToImg(originalElement)
            : convertDummyElementToImg(originalElement);

          if (!newPseudoImage) {
            return null;
          }

          const src = newPseudoImage.src;
          const alt =
            newPseudoImage.getAttribute('aria-label') ??
            newPseudoImage.querySelector('title')?.textContent?.trim() ??
            '';

          return {
            src,
            alt,
            isError: false,
            originalElement,
          };
        })
        .filter((current): current is (typeof imagesCache)[number] => {
          return typeof current !== 'undefined' && current !== null;
        })
        .filter((current, index, self) => {
          return self.findIndex((element) => element?.src === current.src) == index;
        });

  const onkeydown = (e: KeyboardEvent) => {
    const self = e.currentTarget;

    if (e.altKey || e.ctrlKey) {
      return;
    }

    if (self instanceof HTMLButtonElement) {
      const buttons = [
        ...(self.closest('ul')?.querySelectorAll<HTMLButtonElement>('button') ?? []),
      ];
      const index = buttons.indexOf(self);

      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'Home':
          buttons[0]?.click();
          break;
        case 'End':
          buttons[buttons.length - 1]?.click();
          break;
        case 'ArrowRight':
          (buttons[index + 1] || buttons[0])?.click();
          break;
        case 'ArrowLeft':
          (buttons[index - 1] || buttons[buttons.length - 1])?.click();
          break;
        case 'ArrowUp': {
          (
            buttons[index - IMAGE_LIST_COLS] ||
            buttons[Math.floor(buttons.length / IMAGE_LIST_COLS) * IMAGE_LIST_COLS + index] ||
            buttons[
              Math.floor((buttons.length - (buttons.length % IMAGE_LIST_COLS)) / IMAGE_LIST_COLS) *
                IMAGE_LIST_COLS +
                index -
                IMAGE_LIST_COLS
            ]
          )?.click();
          break;
        }
        case 'ArrowDown': {
          const rest = index % IMAGE_LIST_COLS;
          (buttons[index + IMAGE_LIST_COLS] || buttons[rest] || buttons[0])?.click();
          break;
        }
      }
    }
  };
  const listItems = images.flatMap(({ src, alt, isError, originalElement }, index, self) => {
    if (isError) {
      return [];
    }

    const listItem = document.createElement('li');
    const button = document.createElement('button');

    button.tabIndex = -1;
    button.addEventListener('click', () => {
      if (originalElement instanceof HTMLImageElement) {
        STATE.currentImageElement = originalElement;
      } else if (originalElement instanceof SVGElement) {
        const svg = convertedSvgMap.get(originalElement);

        if (svg) {
          STATE.currentImageElement = svg;
        }
      } else {
        const dummy = convertedDummyMap.get(originalElement);

        if (dummy) {
          STATE.currentImageElement = dummy;
        }
      }

      if (!STATE.currentImageElement) {
        return;
      }

      if (button.getAttribute('aria-current') !== 'true') {
        void showDialog({ noCreateImageList: true });
      }
    });
    button.addEventListener('keydown', onkeydown);

    listItem.className = 'image-list-item';
    button.className = 'image-list-item-button';

    if (STATE.currentImageElement?.src === src) {
      button.setAttribute('aria-current', 'true');
      button.tabIndex = 0;
    }

    button.insertAdjacentHTML('afterbegin', `<img />`);

    const img = button.firstElementChild as HTMLImageElement;

    img.src = src;
    img.onerror = () => {
      listItem.remove();

      const target = self[index];

      if (target) {
        target.isError = true;
      }
    };

    // alt がない時、image_list_no_alt を alt に指定するとここの alt が拾われてしまうため、aria-label を使用する
    if (alt) {
      img.alt = alt;
    } else {
      img.setAttribute('aria-label', chrome.i18n.getMessage('image_list_no_alt'));
    }

    listItem.append(button);

    return listItem;
  });

  fragment.append(...listItems);
  imageList.textContent = '';
  imageList.append(fragment);

  const buttons = [...imageList.querySelectorAll('button')];
  const current = buttons.find((button) => button.getAttribute('aria-current') === 'true');
  const currentIndex = current ? buttons.indexOf(current) : -1;
  const viewCurrentIndex = () => {
    imageListInfo.textContent = `${currentIndex + 1} / ${buttons.length}`;
  };

  if (noRecreate) {
    viewCurrentIndex();

    if (current) {
      // scrollIntoView() だと常に上辺か下辺に張り付くため、自前で実装
      const imageListRect = imageList.getBoundingClientRect();
      const targetRect = current.getBoundingClientRect();
      const isNotVisibleTop = targetRect.top < imageListRect.top - IMAGE_LIST_GAP;
      const isNotVisibleBottom = imageListRect.bottom < targetRect.top + IMAGE_LIST_GAP;

      if (isNotVisibleTop) {
        setTimeout(() => {
          imageList.scrollBy(0, targetRect.top - imageListRect.top - IMAGE_LIST_GAP);
        }, 0);
      } else if (isNotVisibleBottom) {
        setTimeout(() => {
          imageList.scrollBy(0, targetRect.bottom - imageListRect.bottom + IMAGE_LIST_GAP);
        }, 0);
      }
    }

    current?.focus();
  } else {
    imagesCache = images;
    imageList.classList.add('invisible');

    setTimeout(() => {
      imageList.classList.remove('invisible');
      viewCurrentIndex();
      current?.scrollIntoView(false);
    }, 300);
  }
};
