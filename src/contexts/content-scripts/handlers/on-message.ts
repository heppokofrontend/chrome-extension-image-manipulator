import { renderToast } from '@/contexts/content-scripts/components/toast';
import { applyImageStyle, ensurePseudoImageVisible } from '@/contexts/content-scripts/effects';
import { resetAll, resetCurrent } from '@/contexts/content-scripts/features';
import { showDialog } from '@/contexts/content-scripts/show-dialog';
import { STATE } from '@/contexts/content-scripts/state';
import { getImageData, setImageData } from '@/contexts/content-scripts/utils';
import { getMessage } from '@/utils';

export const onMessage = (
  message: ContextMenuMessage,
  _: chrome.runtime.MessageSender,
  sendResponse: (response?: boolean) => void,
) => {
  sendResponse(true);

  if (message.actionId === 'reset-all') {
    resetAll();

    return true;
  }

  if (message.actionId === 'dialog') {
    void showDialog();

    return true;
  }

  const targetElement = STATE.currentImageElement;

  if (targetElement === null) {
    renderToast({ message: getMessage('error_targetImageNotDetected') });
    return true;
  }

  const imageData = getImageData(targetElement);
  const { isInDialog } = imageData;

  switch (message.actionId) {
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

  ensurePseudoImageVisible(targetElement);
  applyImageStyle(targetElement);

  return true;
};
