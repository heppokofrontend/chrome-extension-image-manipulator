import { renderToast } from '@/contexts/content-scripts/components/toast';
import { applyImageStyle, ensurePseudoImageVisible } from '@/contexts/content-scripts/effects';
import { resetAll, resetCurrent } from '@/contexts/content-scripts/features';
import { showDialog } from '@/contexts/content-scripts/show-dialog';
import { STATE } from '@/contexts/content-scripts/state';
import {
  convertedImgToDummyMap,
  getImageData,
  setImageData,
} from '@/contexts/content-scripts/utils';
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

  // background-image 由来の合成<img>はダイアログ内クローンとしてのみ編集を許可する。
  // ページ上へ直接挿入すると background-size/position 込みの実際の見た目と
  // 合成<img>のボックスサイズが大きくずれるため(ensurePseudoImageVisible 参照)、
  // クイック操作(ダイアログを開かない編集)は行わずトーストで詳細表示へ誘導する。
  const isQuickAction =
    message.actionId === 'scale' || message.actionId === 'rotate' || message.actionId === 'reverse';

  if (isQuickAction && convertedImgToDummyMap.has(targetElement)) {
    renderToast({ message: getMessage('error_backgroundImageQuickActionUnsupported') });
    return true;
  }

  // ページ側の回転/反転はダイアログを開いた瞬間ではなく操作時点でクローンへ伝播させる。
  // ダイアログ側の操作はクローン自身の StyleData だけを更新するため、ここで書き戻すと
  // ダイアログ内だけで完結した変更(ページ側は未変更)を古い値で上書きしてしまう。
  const propagateToClone = (options: Partial<StyleData>) => {
    if (isInDialog || !imageData.clonedImage) {
      return;
    }

    setImageData({ image: imageData.clonedImage, options });
    applyImageStyle(imageData.clonedImage);
  };

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
      propagateToClone({ rotate: message.value });

      break;

    case 'reverse': {
      const isReversed = !imageData.isReversed;

      setImageData({
        image: targetElement,
        options: { isReversed },
      });
      propagateToClone({ isReversed });

      break;
    }
  }

  ensurePseudoImageVisible(targetElement);
  applyImageStyle(targetElement);

  return true;
};
