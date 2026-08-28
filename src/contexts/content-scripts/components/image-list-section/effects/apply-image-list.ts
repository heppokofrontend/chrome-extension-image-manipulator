import { IMAGE_LIST_GAP, SELECTOR } from '@/contexts/content-scripts/constants';
import {
  convertDummyElementToImg,
  convertSVGToImg,
  getFileSize,
  setImageData,
} from '@/contexts/content-scripts/utils';

import {
  getImageListSectionFields,
  renderImageList,
} from '@/contexts/content-scripts/components/image-list-section/renderers';
import { resolveImageElement } from '@/contexts/content-scripts/components/image-list-section/utils';
import type {
  ImageListEntry,
  ResolvableElement,
} from '@/contexts/content-scripts/components/image-list-section/types';

// 404の画像があったり、bodyスクロール時に画像が追加されたりすると、画像を切り替えるたびにリストを再生成してチカチカしたりするのでキャッシュしておく
let imagesCache: ImageListEntry[] = [];

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

export const applyImageList = (noRecreate: boolean = false) => {
  const { imageList, imageListInfo } = getImageListSectionFields();
  const images = noRecreate ? imagesCache : collectImageListEntries();

  renderImageList(imageList, images);

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

  // FIXME: 300ms以内に applyImageList が連続で呼ばれると、この setTimeout が古い
  // current/currentIndex のクロージャのまま新しいDOMに対して発火し、表示が一瞬チラつく恐れがある。
  // 前回分の setTimeout を clearTimeout してから予約し直すのが本筋。
  setTimeout(() => {
    imageList.classList.remove('invisible');
    viewCurrentIndex();
    current?.scrollIntoView(false);
  }, 300);
};
