import { resetAll, resetCurrent } from '@/contexts/content-scripts/features';
import { showDialog } from '@/contexts/content-scripts/show-dialog';
import { STATE } from '@/contexts/content-scripts/state';
import { applyImageStyle, getImageData, setImageData } from '@/contexts/content-scripts/utils';

export const onMessage = (
  { menuItemId }: { menuItemId: string },
  _: chrome.runtime.MessageSender,
  sendResponse: (response?: boolean) => void,
) => {
  sendResponse(true);

  const targetElement = STATE.currentImageElement;

  if (menuItemId === 'reset-all') {
    resetAll();

    return true;
  }

  if (!targetElement) {
    return true;
  }

  const imageData = getImageData(targetElement);
  const { isInDialog } = imageData;

  if (menuItemId.endsWith('%')) {
    setImageData({
      image: targetElement,
      options: {
        scale: Number(menuItemId.replace(/[^0-9.]/g, '')),
      },
    });
    applyImageStyle(targetElement);

    return true;
  }

  if (menuItemId.endsWith('deg')) {
    setImageData({
      image: targetElement,
      options: {
        rotate: Number(menuItemId.replace(/[^0-9.]/g, '')),
      },
    });
    applyImageStyle(targetElement);

    return true;
  }

  switch (menuItemId) {
    case 'reset':
      resetCurrent(isInDialog);
      break;

    case 'reverse':
      setImageData({
        image: targetElement,
        options: {
          isReversed: !imageData.isReversed,
        },
      });
      applyImageStyle(targetElement);

      break;

    case 'dialog':
      void showDialog();
      break;
  }

  return true;
};
