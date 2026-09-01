import { STATE } from '@/contexts/content-scripts/state';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';

import { applyZoomAndScroll } from './apply-zoom-and-scroll';
import { getFileSize } from './get-file-size';
import { getImageData, setImageData } from './image-data';

const { dialog, spaceElement } = CONTENT_UI;

const setDialogLoading = (isLoading: boolean) => {
  if (isLoading) {
    dialog.setAttribute('aria-busy', 'true');
    spaceElement.classList.add('loading');
  } else {
    dialog.removeAttribute('aria-busy');
    spaceElement.classList.remove('loading');
  }
};

const createClonedImage = async (
  originalImage: HTMLImageElement,
  imageData: StyleData,
): Promise<HTMLImageElement | null> => {
  setDialogLoading(true);

  const clonedImage = new Image();

  clonedImage.alt = originalImage.alt;
  clonedImage.src = originalImage.src;
  clonedImage.width = originalImage.width;
  clonedImage.height = originalImage.height;

  const isError = await new Promise<boolean>((resolve) => {
    clonedImage.onload = () => {
      resolve(false);
    };
    clonedImage.onerror = () => {
      resolve(true);
    };
  });

  if (isError) {
    console.log('Chrome Extension Image Manipulator: 404 ERROR', originalImage);
    setDialogLoading(false);
    return null;
  }

  // ダイアログ用の画像は別で管理する
  setImageData({
    image: clonedImage,
    options: {
      ...imageData,
      isInDialog: true,
      origin: originalImage,
    },
  });

  setImageData({
    image: originalImage,
    options: {
      clonedImage,
    },
  });

  // クローン生成直後に代入しないと、getFileSize 待機中は STATE.currentImageElement が
  // 元の <img> のままになり、待機中の操作(ホイール操作等)が誤って元画像を書き換える
  STATE.currentImageElement = clonedImage;

  // 容量の解決
  const fileInfo = await getFileSize(clonedImage);

  setImageData({ image: clonedImage, options: fileInfo });
  setDialogLoading(false);
  applyZoomAndScroll({ targetImage: clonedImage, scaleValue: imageData.scale });

  return clonedImage;
};

/**
 * 元画像に対応するダイアログ表示用のクローン画像を解決し、STATE.currentImageElement を更新する。
 * クローンが存在しない場合は新規生成する（404 の場合は null を返す）。
 */
export const resolveDialogImage = async (
  originalImage: HTMLImageElement,
  imageData: StyleData,
): Promise<{ initialScale: number | null } | null> => {
  const initialScale =
    !imageData.isInDialog && imageData.clonedImage instanceof HTMLImageElement
      ? getImageData(imageData.clonedImage).scale
      : null;

  if (imageData.isInDialog) {
    return { initialScale };
  }

  if (imageData.clonedImage) {
    STATE.currentImageElement = imageData.clonedImage;
    return { initialScale };
  }

  const clonedImage = await createClonedImage(originalImage, imageData);

  if (!clonedImage) {
    return null;
  }

  return { initialScale };
};
