import { renderImageController } from '@/contexts/content-scripts/components/image-controller';
import { renderImageInfo } from '@/contexts/content-scripts/components/image-info';
import { STATE } from '@/contexts/content-scripts/state';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';

const imageDataMap: Map<HTMLImageElement, StyleData> = new Map();

export const defaultState: StyleData = {
  isInDialog: false,
  clonedImage: null,
  scale: 100,
  oldScale: 100,
  rotate: 0,
  isReversed: false,
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

const getSize = ({
  naturalWidth,
  naturalHeight,
  scale,
}: {
  naturalWidth: number;
  naturalHeight: number;
  scale: number;
}) => {
  const { canvas } = CONTENT_UI;
  const width = naturalWidth * (scale / 100);
  const height = naturalHeight * (scale / 100);
  const contentWidth = (canvas.clientWidth + width / 2) * 2 - 10;
  const contentHeight = (canvas.clientHeight + height / 2) * 2 - 10;

  return {
    spaceSize: {
      width: contentWidth,
      height: contentHeight,
    },
  };
};

export const setImageData = (
  img: HTMLImageElement,
  options: Options,
  shouldUpdateScreen: boolean = true,
) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- 型上は non-null だが、呼び出し元が誤って null を渡した場合の防御
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

  if (!shouldUpdateScreen) {
    return;
  }

  // TODO: ダイアログの外でいじったのを中に伝搬させる。内から外は対応しない。
  const { isInDialog } = imageData;
  const rotate = `rotateZ(${imageData.rotate}deg)`;
  const reverse = imageData.isReversed ? 'rotateY(180deg)' : '';
  const scale = `scale(${imageData.scale / 100})`;

  img.style.transform = `${rotate} ${reverse} ${isInDialog ? '' : scale}`;

  if (STATE.hasBorder) {
    img.classList.add('has-border');
  } else {
    img.classList.remove('has-border');
  }

  if (!isInDialog) {
    return;
  }

  const { naturalWidth, naturalHeight } = img;
  const { scale: dialogScale, oldScale: dialogOldScale, render } = imageData;
  const { spaceSize } = getSize({ naturalWidth, naturalHeight, scale: dialogScale });
  const oldSpaceSize = getSize({
    naturalWidth,
    naturalHeight,
    scale: dialogOldScale,
  }).spaceSize;

  img.style.width = '';
  img.style.height = '';
  img.style.imageRendering = '';
  img.style.cssText = `
    ${img.getAttribute('style') ?? ''}
    width: ${img.naturalWidth * (dialogScale / 100)}px !important;
    height: ${img.naturalHeight * (dialogScale / 100)}px !important;
    image-rendering: ${render} !important;
  `;

  spaceElement.style.cssText = `
    width: ${spaceSize.width}px !important;
    height: ${spaceSize.height}px !important;
  `;

  const diffWidth = (oldSpaceSize.width - spaceSize.width) / 2;
  const diffHeight = (oldSpaceSize.height - spaceSize.height) / 2;
  const { scrollTop, scrollLeft } = canvas;

  canvas.scroll({
    top: scrollTop - diffHeight,
    left: scrollLeft - diffWidth,
  });

  renderImageInfo(imageData);
  renderImageController(imageData);
};
