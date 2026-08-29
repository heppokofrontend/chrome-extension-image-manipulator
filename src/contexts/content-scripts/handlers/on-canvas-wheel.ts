import { STATE } from '@/contexts/content-scripts/state';
import { getImageData, setImageData } from '@/contexts/content-scripts/utils';

const rotateImageData = (imageData: StyleData, deltaY: number) => {
  if (deltaY < 0) {
    imageData.rotate += 10;

    if (360 <= imageData.rotate) {
      imageData.rotate -= 360;
    }

    return;
  }

  imageData.rotate -= 10;

  if (imageData.rotate < 0) {
    imageData.rotate += 360;
  }
};

const resolveZoomDiff = (scale: number) => {
  if (scale < 40) {
    return 3;
  }

  if (scale < 50) {
    return 5;
  }

  return 10;
};

const zoomImageData = (imageData: StyleData, deltaY: number) => {
  const diff = resolveZoomDiff(imageData.scale);

  if (deltaY < 0) {
    imageData.scale = imageData.scale === 1 ? diff : imageData.scale + diff;

    return;
  }

  imageData.scale -= diff;

  if (imageData.scale <= 0) {
    imageData.scale = 1;
  }
};

export const onCanvasWheel = (e: WheelEvent) => {
  e.preventDefault();

  if (!STATE.currentImageElement) {
    return;
  }

  const imageData = getImageData(STATE.currentImageElement);

  if (e.shiftKey) {
    rotateImageData(imageData, e.deltaY);
  } else {
    zoomImageData(imageData, e.deltaY);
  }

  setImageData(STATE.currentImageElement, {
    ...imageData,
  });
};
