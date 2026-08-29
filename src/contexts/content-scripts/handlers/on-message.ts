import { resetAll, resetCurrent } from '@/contexts/content-scripts/features';
import { showDialog } from '@/contexts/content-scripts/show-dialog';
import { STATE } from '@/contexts/content-scripts/state';
import { getImageData, setImageData } from '@/contexts/content-scripts/utils';

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
    setImageData(targetElement, {
      scale: Number(menuItemId.replace(/[^0-9.]/g, '')),
    });

    return true;
  }

  if (menuItemId.endsWith('deg')) {
    setImageData(targetElement, {
      rotate: Number(menuItemId.replace(/[^0-9.]/g, '')),
    });

    return true;
  }

  switch (menuItemId) {
    case 'reset':
      resetCurrent(isInDialog);
      break;

    case 'reverse':
      setImageData(targetElement, {
        reverse: !imageData.reverse,
      });

      break;

    case 'dialog':
      void showDialog();
      break;
  }

  return true;
};
