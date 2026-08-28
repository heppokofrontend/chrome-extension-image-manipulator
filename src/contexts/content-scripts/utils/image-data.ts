import { CONTENT_UI } from '@/contexts/content-scripts/ui';
import { STATE } from '@/contexts/content-scripts/state';
import { setInputValues } from './set-input-values';

const imageDataMap: Map<HTMLImageElement, StyleData> = new Map();

export const defaultState: StyleData = {
  isInDialog: false,
  clonedImage: null,
  scale: 100,
  oldScale: 100,
  rotate: 0,
  reverse: false,
  render: 'crisp-edges',
  fileSize: 'loading...',
  fileType: 'loading...',
};

export const getImageData = (key: HTMLImageElement) => {
  if (!imageDataMap.has(key)) {
    imageDataMap.set(key, { ...defaultState });
  }

  return { ...imageDataMap.get(key) } as StyleData;
};

export const setImageData = (
  img: HTMLImageElement,
  options: Options,
  noNeedInitScreen: boolean = false,
) => {
  if (!img) {
    return;
  }

  const { canvas, spaceElement } = CONTENT_UI;

  const baseImageData = getImageData(img);
  const oldScale = baseImageData.scale;
  const imageData = {
    ...baseImageData,
    ...options,
    oldScale,
  } as StyleData;

  imageDataMap.set(img, {
    ...imageData,
  });

  if (noNeedInitScreen) {
    return;
  }

  // TODO: ダイアログの外でいじったのを中に伝搬させる。内から外は対応しない。
  const { isInDialog } = imageData;
  const rotate = `rotateZ(${imageData.rotate}deg)`;
  const reverse = imageData.reverse ? 'rotateY(180deg)' : '';
  const scale = `scale(${imageData.scale / 100})`;

  img.style.transform = `${rotate} ${reverse} ${isInDialog ? '' : scale}`;

  if (STATE.hasBorder) {
    img.classList.add('has-border');
  } else {
    img.classList.remove('has-border');
  }

  if (isInDialog) {
    const getSize = (img: HTMLImageElement, scale: number) => {
      const width = img.naturalWidth * (scale / 100);
      const height = img.naturalHeight * (scale / 100);
      const contentWidth = ((canvas.clientWidth ?? 0) + width / 2) * 2 - 10;
      const contentHeight = ((canvas.clientHeight ?? 0) + height / 2) * 2 - 10;

      return {
        spaceSize: {
          width: contentWidth,
          height: contentHeight,
        },
      };
    };

    const { scale, oldScale, render } = imageData;
    const { spaceSize } = getSize(img, scale);
    const olsSpaceSize = getSize(img, oldScale).spaceSize;

    img.style.width = '';
    img.style.height = '';
    img.style.imageRendering = '';
    img.style.cssText = `
        ${img.getAttribute('style')}
        width: ${img.naturalWidth * (scale / 100)}px !important;
        height: ${img.naturalHeight * (scale / 100)}px !important;
        image-rendering: ${render} !important;
      `;

    spaceElement.style.cssText = `
        width: ${spaceSize.width}px !important;
        height: ${spaceSize.height}px !important;
      `;

    const diffWidth = (olsSpaceSize.width - spaceSize.width) / 2;
    const diffHeight = (olsSpaceSize.height - spaceSize.height) / 2;
    const { scrollTop, scrollLeft } = canvas;

    canvas.scroll({
      top: scrollTop - diffHeight,
      left: scrollLeft - diffWidth,
    });

    setInputValues(imageData);
  }
};
