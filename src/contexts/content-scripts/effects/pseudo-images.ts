import { convertedImgToSVGMap } from '@/contexts/content-scripts/utils';

/**
 * 元要素は削除せず残すことで、search-in-page.ts の要素追跡を壊さない。
 */
export const ensurePseudoImageVisible = (image: HTMLImageElement) => {
  if (image.isConnected) {
    return;
  }

  const original = convertedImgToSVGMap.get(image);

  if (!original || !original.isConnected) {
    return;
  }

  original.style.setProperty('display', 'none');
  original.after(image);
};

/**
 * リセット時に呼び、合成<img>が残ったまま操作対象扱いされ続けるのを防ぐ。
 */
export const restoreOriginalElement = (image: HTMLImageElement) => {
  const original = convertedImgToSVGMap.get(image);

  if (!original) {
    return;
  }

  image.remove();
  original.style.removeProperty('display');
};
