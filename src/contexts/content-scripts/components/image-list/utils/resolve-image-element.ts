import type { ResolvableElement } from '@/contexts/content-scripts/components/image-list/types';
import { convertedDummyMap, convertedSvgMap } from '@/contexts/content-scripts/utils';

// originalElement (img自体 / SVG / SVG以外の疑似画像要素) から実際に表示すべき画像要素を1本の分岐で解決する
export const resolveImageElement = (
  originalElement: ResolvableElement,
): HTMLImageElement | undefined => {
  if (originalElement instanceof HTMLImageElement) {
    return originalElement;
  }

  return originalElement instanceof SVGElement
    ? convertedSvgMap.get(originalElement)
    : convertedDummyMap.get(originalElement);
};
