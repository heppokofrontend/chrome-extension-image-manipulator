import { STATE } from '@/contexts/content-scripts/state';
import { getImageData, setImageData } from '@/contexts/content-scripts/utils';

const rotateImageData = (rotate: number, deltaY: number) => {
  if (deltaY < 0) {
    const next = rotate + 10;

    return 360 <= next ? next - 360 : next;
  }

  const next = rotate - 10;

  return next < 0 ? next + 360 : next;
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

const zoomImageData = (scale: number, deltaY: number) => {
  const diff = resolveZoomDiff(scale);

  if (deltaY < 0) {
    return scale === 1 ? diff : scale + diff;
  }

  const next = scale - diff;

  return next <= 0 ? 1 : next;
};

export const onCanvasWheel = (e: WheelEvent) => {
  e.preventDefault();

  if (!STATE.currentImageElement) {
    return;
  }

  const imageData = getImageData(STATE.currentImageElement);
  const rotate = e.shiftKey ? rotateImageData(imageData.rotate, e.deltaY) : imageData.rotate;
  const scale = e.shiftKey ? imageData.scale : zoomImageData(imageData.scale, e.deltaY);

  setImageData(STATE.currentImageElement, {
    ...imageData,
    rotate,
    scale,
  });
};
