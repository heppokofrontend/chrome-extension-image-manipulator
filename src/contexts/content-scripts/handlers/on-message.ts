import { resetAll, resetCurrent } from '@/contexts/content-scripts/features';
import { showDialog } from '@/contexts/content-scripts/show-dialog';
import { STATE } from '@/contexts/content-scripts/state';
import { applyImageStyle, getImageData, setImageData } from '@/contexts/content-scripts/utils';

export const onMessage = (
  message: ContextMenuMessage,
  _: chrome.runtime.MessageSender,
  sendResponse: (response?: boolean) => void,
) => {
  sendResponse(true);

  const targetElement = STATE.currentImageElement;

  if (message.actionId === 'reset-all') {
    resetAll();

    return true;
  }

  if (!targetElement) {
    return true;
  }

  const imageData = getImageData(targetElement);
  const { isInDialog } = imageData;

  switch (message.actionId) {
    case 'dialog':
      void showDialog();
      return true;

    case 'reset':
      resetCurrent(isInDialog);
      return true;

    case 'scale':
      setImageData({
        image: targetElement,
        options: { scale: message.value },
      });

      break;

    case 'rotate':
      setImageData({
        image: targetElement,
        options: { rotate: message.value },
      });

      break;

    case 'reverse':
      setImageData({
        image: targetElement,
        options: {
          isReversed: !imageData.isReversed,
        },
      });

      break;
  }

  applyImageStyle(targetElement);

  return true;
};
