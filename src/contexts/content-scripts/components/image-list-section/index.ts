import { showDialog } from '@/contexts/content-scripts/show-dialog';
import { IMAGE_LIST_GAP, SELECTOR } from '@/contexts/content-scripts/constants';
import { STATE } from '@/contexts/content-scripts/state';
import {
  convertDummyElementToImg,
  convertedDummyMap,
  convertedSvgMap,
  convertSVGToImg,
  getFileSize,
  setImageData,
} from '@/contexts/content-scripts/utils';

import { onImageListKeydown } from './handlers';
import { getImageListSectionFields } from './renderers';

export { getImageListSectionFields, renderImageListSection } from './renderers';

type ResolvableElement = HTMLImageElement | SVGElement | HTMLElement;

type ImageListEntry = {
  src: string;
  alt: string;
  isError: boolean;
  originalElement: SVGElement | HTMLElement;
};

// 404の画像があったり、bodyスクロール時に画像が追加されたりすると、画像を切り替えるたびにリストを再生成してチカチカしたりするのでキャッシュしておく
let imagesCache: ImageListEntry[] = [];

// originalElement (img自体 / SVG / SVG以外の疑似画像要素) から実際に表示すべき画像要素を1本の分岐で解決する
const resolveImageElement = (originalElement: ResolvableElement): HTMLImageElement | undefined => {
  if (originalElement instanceof HTMLImageElement) {
    return originalElement;
  }

  return originalElement instanceof SVGElement
    ? convertedSvgMap.get(originalElement)
    : convertedDummyMap.get(originalElement);
};

const toImageListEntry = (originalElement: ResolvableElement): ImageListEntry | null => {
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
  const pseudoImage = resolveImageElement(originalElement);

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
};

// scrollIntoView() だと常に上辺か下辺に張り付くため、自前で実装
const scheduleScrollAdjustment = (imageList: HTMLElement, current: HTMLElement | undefined) => {
  if (!current) {
    return;
  }

  current.focus();

  const imageListRect = imageList.getBoundingClientRect();
  const targetRect = current.getBoundingClientRect();
  const scrollDelta = (() => {
    const isNotVisibleTop = targetRect.top < imageListRect.top - IMAGE_LIST_GAP;
    const isNotVisibleBottom = imageListRect.bottom < targetRect.top + IMAGE_LIST_GAP;

    if (isNotVisibleTop) {
      return targetRect.top - imageListRect.top - IMAGE_LIST_GAP;
    }

    if (isNotVisibleBottom) {
      return targetRect.bottom - imageListRect.bottom + IMAGE_LIST_GAP;
    }

    return null;
  })();

  if (scrollDelta === null) {
    return;
  }

  setTimeout(() => {
    imageList.scrollBy(0, scrollDelta);
  }, 0);
};

const collectImageListEntries = (): ImageListEntry[] =>
  [...document.querySelectorAll<ResolvableElement>(SELECTOR)]
    .map(toImageListEntry)
    .filter((current): current is ImageListEntry => current !== null)
    .filter((current, index, self) => {
      return self.findIndex((element) => element?.src === current.src) == index;
    });

const buildListItems = (images: ImageListEntry[]): HTMLLIElement[] =>
  images.flatMap(({ src, alt, isError, originalElement }, index, self) => {
    if (isError) {
      return [];
    }

    const listItem = document.createElement('li');
    const button = document.createElement('button');

    button.tabIndex = -1;
    button.addEventListener('click', () => {
      const resolved = resolveImageElement(originalElement);

      // FIXME: resolved が undefined の時 STATE.currentImageElement が前回値のまま残り、
      // 直後の !STATE.currentImageElement ガードを素通りして無関係な前回選択画像でダイアログが開く恐れがある。
      // 現状は convertedSvgMap/convertedDummyMap が .delete() されないので実質到達しないはずだが、
      // 前提が崩れると気付きにくく壊れる。resolved が falsy なら早期 return する形に直すのが本筋。
      if (resolved) {
        STATE.currentImageElement = resolved;
      }

      if (!STATE.currentImageElement) {
        return;
      }

      if (button.getAttribute('aria-current') !== 'true') {
        void showDialog({ noCreateImageList: true });
      }
    });
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

    button.append(img);
    listItem.append(button);

    return listItem;
  });

export const createImageList = (noRecreate: boolean = false) => {
  const { imageList, imageListInfo } = getImageListSectionFields();
  const fragment = document.createDocumentFragment();
  const images = noRecreate ? imagesCache : collectImageListEntries();
  const listItems = buildListItems(images);

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
    scheduleScrollAdjustment(imageList, current);

    return;
  }

  imagesCache = images;
  imageList.classList.add('invisible');

  // FIXME: 300ms以内に createImageList が連続で呼ばれると、この setTimeout が古い
  // current/currentIndex のクロージャのまま新しいDOMに対して発火し、表示が一瞬チラつく恐れがある。
  // 前回分の setTimeout を clearTimeout してから予約し直すのが本筋。
  setTimeout(() => {
    imageList.classList.remove('invisible');
    viewCurrentIndex();
    current?.scrollIntoView(false);
  }, 300);
};
