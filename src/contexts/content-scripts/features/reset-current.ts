import { STATE } from '@/contexts/content-scripts/state';
import { defaultState, getImageData, setImageData } from '@/contexts/content-scripts/utils';

export const resetCurrent = (isInDialog: boolean) => {
  const targetElement = STATE.currentImageElement;

  if (!targetElement) {
    return;
  }

  if (isInDialog) {
    const imageData = getImageData(targetElement);

    targetElement.removeAttribute('style');

    setImageData(targetElement, {
      ...defaultState,
      isInDialog,
      oldScale: imageData.oldScale,
      fileSize: imageData.fileSize,
    });

    return;
  }

  if (typeof targetElement.dataset['imageManipulatorDefaultStyle'] === 'string') {
    targetElement.setAttribute('style', targetElement.dataset['imageManipulatorDefaultStyle']);
  }
};
