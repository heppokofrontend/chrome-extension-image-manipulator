import { STATE } from '@/contexts/content-scripts/state';
import { getImageData, setImageData } from '@/contexts/content-scripts/utils';

export const onCanvasWheel = (e: WheelEvent) => {
  e.preventDefault();

  if (!STATE.currentImageElement) {
    return;
  }

  const imageData = getImageData(STATE.currentImageElement);
  const mode = e.shiftKey ? 'rotate' : 'zoom';

  if (mode === 'rotate') {
    switch (e.deltaY < 0 ? 'right' : 'left') {
      case 'right':
        imageData.rotate += 10;

        if (360 <= imageData.rotate) {
          imageData.rotate -= 360;
        }

        break;

      case 'left':
        imageData.rotate -= 10;

        if (imageData.rotate < 0) {
          imageData.rotate += 360;
        }
        break;
    }
  } else {
    const diff = imageData.scale < 50 ? (imageData.scale < 40 ? 3 : 5) : 10;

    switch (e.deltaY < 0 ? 'in' : 'out') {
      case 'in':
        if (imageData.scale === 1) {
          imageData.scale = diff;
        } else {
          imageData.scale += diff;
        }
        break;

      case 'out':
        imageData.scale -= diff;

        if (imageData.scale <= 0) {
          imageData.scale = 1;
        }
        break;
    }
  }

  setImageData(STATE.currentImageElement, {
    ...imageData,
  });
};
