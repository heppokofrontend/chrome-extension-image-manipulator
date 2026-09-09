import { STATE } from '@/contexts/content-scripts/state';
import {
  applyImageStyle,
  defaultState,
  getImageData,
  setImageData,
} from '@/contexts/content-scripts/utils';

export const resetCurrent = (isInDialog: boolean) => {
  const targetElement = STATE.currentImageElement;

  if (!targetElement) {
    return;
  }

  if (isInDialog) {
    const imageData = getImageData(targetElement);

    targetElement.removeAttribute('style');

    setImageData({
      image: targetElement,
      options: {
        ...defaultState,
        isInDialog,
        oldScale: imageData.oldScale,
        fileSize: imageData.fileSize,
      },
    });
    applyImageStyle(targetElement);

    return;
  }

  const imageData = getImageData(targetElement);

  setImageData({
    image: targetElement,
    options: {
      ...defaultState,
      oldScale: imageData.oldScale,
      fileSize: imageData.fileSize,
    },
  });
  applyImageStyle(targetElement);

  if (!imageData.isInDialog && imageData.clonedImage) {
    const clonedImageData = getImageData(imageData.clonedImage);

    setImageData({
      image: imageData.clonedImage,
      options: {
        ...defaultState,
        isInDialog: true,
        oldScale: clonedImageData.oldScale,
        fileSize: clonedImageData.fileSize,
      },
    });
    applyImageStyle(imageData.clonedImage);
  }

  if (typeof targetElement.dataset['imageManipulatorDefaultStyle'] === 'string') {
    targetElement.setAttribute('style', targetElement.dataset['imageManipulatorDefaultStyle']);
  }
};
