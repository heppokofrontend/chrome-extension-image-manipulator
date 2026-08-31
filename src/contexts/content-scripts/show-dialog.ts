import { renderCanvas } from '@/contexts/content-scripts/components/canvas';
import { renderImageController } from '@/contexts/content-scripts/components/image-controller';
import { renderImageInfo } from '@/contexts/content-scripts/components/image-info';
import { applyImageList } from '@/contexts/content-scripts/components/image-list';
import { STATE } from '@/contexts/content-scripts/state';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';
import {
  getFileSize,
  getImageData,
  setImageData,
  zoomAndScrollInit,
} from '@/contexts/content-scripts/utils';

const { dialog, spaceElement, imageList } = CONTENT_UI;

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
  setImageData(clonedImage, {
    ...imageData,
    isInDialog: true,
    origin: originalImage,
  });

  setImageData(originalImage, {
    clonedImage,
  });

  // クローン生成直後に代入しないと、getFileSize 待機中は STATE.currentImageElement が
  // 元の <img> のままになり、待機中の操作(ホイール操作等)が誤って元画像を書き換える
  STATE.currentImageElement = clonedImage;

  // 容量の解決
  await getFileSize(clonedImage).finally(() => {
    setDialogLoading(false);
    zoomAndScrollInit(clonedImage, imageData.scale);
  });

  return clonedImage;
};

/**
 * 元画像に対応するダイアログ表示用のクローン画像を解決し、STATE.currentImageElement を更新する。
 * クローンが存在しない場合は新規生成する（404 の場合は null を返す）。
 */
const resolveDialogImage = async (
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

export const showDialog = async (option?: { noRecreateImageList?: boolean }) => {
  const noRecreateImageList = option?.noRecreateImageList ?? false;

  if (!dialog.open) {
    dialog.showModal();
  }

  if (!STATE.currentImageElement) {
    return;
  }

  const originalImageData = getImageData(STATE.currentImageElement);
  const resolved = await resolveDialogImage(STATE.currentImageElement, originalImageData);

  if (!resolved) {
    return;
  }

  renderCanvas();
  applyImageList(noRecreateImageList);

  if (dialog.open) {
    imageList.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();
  } else {
    dialog.showModal();
  }

  zoomAndScrollInit(STATE.currentImageElement, resolved.initialScale ?? 'init');

  // resolveDialogImage/zoomAndScrollInit を経て STATE.currentImageElement は
  // ダイアログ用クローンに切り替わっているため、そのクローンの最新データで描画する。
  const clonedImageData = getImageData(STATE.currentImageElement);

  renderImageInfo(clonedImageData);
  renderImageController(clonedImageData);
};
