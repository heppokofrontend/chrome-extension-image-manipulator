import type {
  ImageListEntry,
  ResolvableElement,
} from '@/contexts/content-scripts/components/image-list/types';
import { SELECTOR } from '@/contexts/content-scripts/constants';
import {
  convertDummyElementToImg,
  convertSVGToImg,
  getFileSize,
  setImageData,
} from '@/contexts/content-scripts/utils';

import { resolveImageElement } from './resolve-image-element';

// 404の画像があったり、bodyスクロール時に画像が追加されたりすると、画像を切り替えるたびにリストを再生成してチカチカしたりするのでキャッシュしておく
let imagesCache: ImageListEntry[] = [];

// lazyload対応で load 発火のたびに呼ぶため、要素ごとに閉じ込めずモジュールスコープに置く
const handleLazyLoadedImage = async (originalElement: HTMLImageElement, result: ImageListEntry) => {
  const clonedImage = document.createElement('img');
  result.src = originalElement.src;
  result.alt = originalElement.alt;
  clonedImage.src = originalElement.src;
  clonedImage.alt = originalElement.alt;

  setImageData({
    image: originalElement,
    options: {
      clonedImage,
    },
    shouldUpdateScreen: false,
  });
  const fileInfo = await getFileSize(clonedImage);

  setImageData({
    image: clonedImage,
    options: {
      isInDialog: true,
      origin: originalElement,
      ...fileInfo,
    },
    shouldUpdateScreen: false,
  });
};

const makeEntry = ({
  src,
  alt,
  originalElement,
}: {
  src: string;
  alt: string;
  originalElement: ResolvableElement;
}): ImageListEntry => ({
  src,
  alt,
  isError: false,
  originalElement,
});

const toImageListEntry = (originalElement: ResolvableElement): ImageListEntry | null => {
  if (originalElement instanceof HTMLImageElement) {
    const result = makeEntry({
      src: originalElement.src,
      alt: originalElement.alt.trim(),
      originalElement,
    });

    // support lazyload by script
    originalElement.addEventListener('load', () => {
      void handleLazyLoadedImage(originalElement, result);
    });
    originalElement.addEventListener('error', () => {
      result.isError = true;
    });

    return result;
  }

  const pseudoImage = resolveImageElement(originalElement);

  if (pseudoImage) {
    return makeEntry({ src: pseudoImage.src, alt: pseudoImage.alt, originalElement });
  }

  const newPseudoImage =
    originalElement instanceof SVGElement
      ? convertSVGToImg(originalElement)
      : convertDummyElementToImg(originalElement);

  if (!newPseudoImage) {
    return null;
  }

  const alt =
    newPseudoImage.getAttribute('aria-label') ??
    newPseudoImage.querySelector('title')?.textContent.trim() ??
    '';

  return makeEntry({ src: newPseudoImage.src, alt, originalElement });
};

// useCache: true の場合はDOM走査をスキップしてキャッシュを返す(呼び出し側の再生成要否判断をここに閉じ込める)
export const collectImageListEntries = (useCache: boolean): ImageListEntry[] => {
  if (useCache) {
    return imagesCache;
  }

  imagesCache = [...document.querySelectorAll<ResolvableElement>(SELECTOR)]
    .map(toImageListEntry)
    .filter((current): current is ImageListEntry => current !== null)
    .filter((current, index, self) => {
      return self.findIndex((entry) => entry.src === current.src) === index;
    });

  return imagesCache;
};
