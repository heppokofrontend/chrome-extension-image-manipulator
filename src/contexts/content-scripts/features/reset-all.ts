import { STATE } from '@/contexts/content-scripts/state';
import {
  applyImageStyle,
  defaultState,
  getImageData,
  setImageData,
} from '@/contexts/content-scripts/utils';

export const resetAll = () => {
  const targetElement = STATE.currentImageElement;
  const nodeList = [
    ...(targetElement ? [targetElement] : []),
    ...document.querySelectorAll<HTMLImageElement>('[data-image-manipulator-default-style]'),
  ];

  nodeList.forEach((image) => {
    const imageData = getImageData(image);

    setImageData({
      image,
      options: {
        ...defaultState,
        oldScale: imageData.oldScale,
        fileSize: imageData.fileSize,
      },
    });
    applyImageStyle(image);

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

    if (typeof image.dataset['imageManipulatorDefaultStyle'] === 'string') {
      image.setAttribute('style', image.dataset['imageManipulatorDefaultStyle']);
    }
  });
};
